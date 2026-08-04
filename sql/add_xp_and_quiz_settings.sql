-- =======================================================
-- Adds columns that application code already reads/writes
-- but were never migrated into the schema:
--   - profiles.xp            (quiz results page increments this on pass)
--   - quizzes.time_limit_seconds (quiz page reads this for the countdown timer)
--   - quizzes.shuffle_questions  (admin-configurable per-quiz question order)
-- Run once in Supabase SQL Editor.
-- =======================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN NOT NULL DEFAULT false;

-- Backfill XP for existing students from their completed lessons + passed quizzes,
-- using the same formula the dashboard used to compute client-side
-- (10 XP per completed lesson, 100 XP per passed quiz) so no one's progress resets.
UPDATE public.profiles p
SET xp = COALESCE(lesson_xp.total, 0) + COALESCE(quiz_xp.total, 0)
FROM (
  SELECT student_id, COUNT(*) * 10 AS total
  FROM public.progress
  WHERE status = 'COMPLETED'
  GROUP BY student_id
) lesson_xp
FULL OUTER JOIN (
  SELECT student_id, COUNT(*) * 100 AS total
  FROM public.quiz_attempts
  WHERE passed = true
  GROUP BY student_id
) quiz_xp ON quiz_xp.student_id = lesson_xp.student_id
WHERE p.id = COALESCE(lesson_xp.student_id, quiz_xp.student_id)
  AND p.xp = 0;
