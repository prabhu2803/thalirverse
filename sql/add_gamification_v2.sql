-- =======================================================
-- Gamification expansion v2: server-side XP awarding (fixes the
-- client-side read-then-write race condition + trivially-bypassable
-- sessionStorage gate) and a milestone-celebration gate.
-- Run once in Supabase SQL Editor.
-- =======================================================

ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS xp_awarded INTEGER,
  ADD COLUMN IF NOT EXISTS xp_bonus_tier VARCHAR(20);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS highest_milestone_celebrated SMALLINT NOT NULL DEFAULT 0;

-- Backfill xp_awarded on existing passed attempts using the same base-XP
-- formula the client used, so the new achievement-history feed (Phase 7/8)
-- doesn't show a gap for already-seeded data. No bonus tier for backfilled
-- rows (xp_bonus_tier stays NULL) — there is no fair roll to reconstruct
-- retroactively, and profiles.xp was already backfilled once by
-- add_xp_and_quiz_settings.sql, so this only fills in the per-attempt
-- breakdown, it does not re-touch profiles.xp.
UPDATE public.quiz_attempts qa
SET xp_awarded = ROUND((qa.score::numeric / 100) * (q_count.total * 10) + 100)
FROM (
  SELECT quiz_id, COUNT(*) AS total
  FROM public.questions
  GROUP BY quiz_id
) q_count
WHERE qa.quiz_id = q_count.quiz_id
  AND qa.passed = true
  AND qa.xp_awarded IS NULL;

-- =======================================================
-- award_quiz_xp: the single place XP is ever granted from.
-- Verifies the caller owns the attempt and it passed, computes base XP
-- deterministically from score + question count, and — only on the
-- attempt's first award — rolls a weighted-random bonus tier server-side
-- so the odds are never client-visible/predictable. Re-calling on an
-- already-awarded attempt (e.g. a page refresh) replays the stored
-- breakdown instead of re-rolling. The UPDATE ... WHERE xp_awarded IS NULL
-- claim makes the award atomic, so a concurrent double-submit can't grant
-- XP twice even if this function races itself.
-- =======================================================
CREATE OR REPLACE FUNCTION public.award_quiz_xp(p_attempt_id UUID)
RETURNS TABLE(base_xp INTEGER, bonus_xp INTEGER, bonus_tier VARCHAR, total_awarded INTEGER, new_xp_total INTEGER, is_first_award BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id      UUID;
  v_quiz_id         VARCHAR(100);
  v_score           INTEGER;
  v_passed          BOOLEAN;
  v_existing_xp     INTEGER;
  v_existing_tier   VARCHAR(20);
  v_total_questions INTEGER;
  v_base            INTEGER;
  v_roll            NUMERIC;
  v_bonus           INTEGER;
  v_tier            VARCHAR(20);
  v_total           INTEGER;
  v_new_xp          INTEGER;
BEGIN
  SELECT student_id, quiz_id, score, passed, xp_awarded, xp_bonus_tier
    INTO v_student_id, v_quiz_id, v_score, v_passed, v_existing_xp, v_existing_tier
  FROM public.quiz_attempts
  WHERE id = p_attempt_id;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  IF v_student_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT v_passed THEN
    RAISE EXCEPTION 'Attempt did not pass';
  END IF;

  SELECT COUNT(*) INTO v_total_questions FROM public.questions WHERE quiz_id = v_quiz_id;
  v_base := ROUND((v_score::numeric / 100) * (v_total_questions * 10) + 100);

  -- Idempotent replay: already awarded, return the stored breakdown without re-rolling.
  IF v_existing_xp IS NOT NULL THEN
    SELECT xp INTO v_new_xp FROM public.profiles WHERE id = v_student_id;
    RETURN QUERY SELECT v_base, v_existing_xp - v_base, v_existing_tier, v_existing_xp, v_new_xp, false;
    RETURN;
  END IF;

  v_roll := random();
  IF v_roll < 0.60 THEN
    v_tier := 'common';   v_bonus := floor(random() * 11)::INTEGER;        -- 0-10
  ELSIF v_roll < 0.85 THEN
    v_tier := 'uncommon'; v_bonus := 15 + floor(random() * 16)::INTEGER;   -- 15-30
  ELSIF v_roll < 0.97 THEN
    v_tier := 'rare';     v_bonus := 40 + floor(random() * 31)::INTEGER;   -- 40-70
  ELSE
    v_tier := 'jackpot';  v_bonus := 100 + floor(random() * 51)::INTEGER;  -- 100-150
  END IF;
  v_total := v_base + v_bonus;

  UPDATE public.quiz_attempts
  SET xp_awarded = v_total, xp_bonus_tier = v_tier
  WHERE id = p_attempt_id AND xp_awarded IS NULL;

  IF NOT FOUND THEN
    -- Lost a concurrent race — another call already claimed the award.
    -- Replay whatever it stored instead of granting a second one.
    SELECT xp_awarded, xp_bonus_tier INTO v_total, v_tier
    FROM public.quiz_attempts WHERE id = p_attempt_id;
    v_bonus := v_total - v_base;
    SELECT xp INTO v_new_xp FROM public.profiles WHERE id = v_student_id;
    RETURN QUERY SELECT v_base, v_bonus, v_tier, v_total, v_new_xp, false;
    RETURN;
  END IF;

  UPDATE public.profiles SET xp = xp + v_total WHERE id = v_student_id;
  SELECT xp INTO v_new_xp FROM public.profiles WHERE id = v_student_id;

  RETURN QUERY SELECT v_base, v_bonus, v_tier, v_total, v_new_xp, true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_quiz_xp(UUID) TO authenticated;

-- =======================================================
-- get_school_leaderboard: a student can't read a classmate's profile row
-- under the existing RLS policy (id = auth.uid() OR is_admin()), so this
-- SECURITY DEFINER function is the only path to a peer-visible leaderboard.
-- Scoped to the caller's own school ONLY — never cross-school, since
-- schools vary hugely in size and a global board would be unfair to
-- students at a small school. Always includes the caller's own row, even
-- when they're outside the top N, so they can see their own rank.
-- =======================================================
CREATE OR REPLACE FUNCTION public.get_school_leaderboard(p_limit INTEGER DEFAULT 20)
RETURNS TABLE(full_name VARCHAR, xp INTEGER, rank BIGINT, is_self BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT school_id INTO v_school_id FROM public.profiles WHERE id = auth.uid();
  IF v_school_id IS NULL THEN
    RETURN; -- no school on record — nothing to rank against
  END IF;

  RETURN QUERY
  WITH ranked AS (
    SELECT p.id, p.full_name, p.xp,
      RANK() OVER (ORDER BY p.xp DESC) AS rnk
    FROM public.profiles p
    WHERE p.school_id = v_school_id AND p.role = 'STUDENT'
  )
  SELECT r.full_name, r.xp, r.rnk, (r.id = auth.uid())
  FROM ranked r
  WHERE r.rnk <= p_limit OR r.id = auth.uid()
  ORDER BY r.rnk;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_school_leaderboard(INTEGER) TO authenticated;
