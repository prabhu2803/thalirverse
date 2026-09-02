-- =======================================================
-- Class-level collective progress (non-comparative, no classmate names/
-- scores exposed). A "class" = students.school_id + students.standard,
-- ignoring `section` (it defaults to 'A' for ~every seeded/real student
-- today, so it isn't reliable grouping data yet — a future refinement
-- once schools report distinct sections).
--
-- RLS on students/progress/quiz_attempts is own-row-or-admin only, so a
-- student can't read a classmate's row directly — same reason
-- get_school_leaderboard (add_gamification_v2.sql) needs SECURITY DEFINER.
-- Unlike the leaderboard, this returns ONLY aggregate counts — never an
-- individual classmate's name, id, or score — because it's meant to read
-- as shared/observed truth about a group, not a comparison.
--
-- School scope is COALESCE(students.school_id, profiles.school_id): real
-- (non-seeded) signups only ever write profiles.school_id — students.
-- school_id is left null by handle_new_user() and only ever backfilled by
-- the mock-data seed scripts. Deriving school purely from students.school_id
-- would silently return an empty class for every real student.
-- =======================================================
CREATE OR REPLACE FUNCTION public.get_class_progress()
RETURNS TABLE(
  class_size               INTEGER,
  students_active          INTEGER,
  total_lessons_completed  INTEGER,
  total_quiz_passes        INTEGER,
  collective_completions   INTEGER,
  milestone_tier           INTEGER,
  standard                 VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_id UUID;
  v_standard  VARCHAR(50);
  v_lessons   INTEGER;
  v_quizzes   INTEGER;
  v_active    INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(st.school_id, p.school_id), st.standard
    INTO v_school_id, v_standard
  FROM public.students st
  JOIN public.profiles p ON p.id = st.user_id
  WHERE st.user_id = auth.uid();

  IF v_school_id IS NULL OR v_standard IS NULL THEN
    RETURN; -- nothing to report yet (no school/standard on record)
  END IF;

  CREATE TEMP TABLE class_students ON COMMIT DROP AS
  SELECT p.id AS student_id
  FROM public.students st
  JOIN public.profiles p ON p.id = st.user_id
  WHERE COALESCE(st.school_id, p.school_id) = v_school_id
    AND st.standard = v_standard
    AND p.role = 'STUDENT';

  SELECT COUNT(*) INTO v_lessons FROM public.progress
    WHERE status = 'COMPLETED' AND student_id IN (SELECT student_id FROM class_students);

  -- Distinct (student, quiz) so a retry pass doesn't double-count.
  SELECT COUNT(*) INTO v_quizzes FROM (
    SELECT DISTINCT student_id, quiz_id FROM public.quiz_attempts
    WHERE passed = true AND student_id IN (SELECT student_id FROM class_students)
  ) x;

  SELECT COUNT(*) INTO v_active FROM (
    SELECT student_id FROM public.progress WHERE status = 'COMPLETED' AND student_id IN (SELECT student_id FROM class_students)
    UNION
    SELECT student_id FROM public.quiz_attempts WHERE student_id IN (SELECT student_id FROM class_students)
  ) y;

  RETURN QUERY SELECT
    (SELECT COUNT(*)::INTEGER FROM class_students),
    v_active,
    v_lessons,
    v_quizzes,
    v_lessons + v_quizzes,
    ((v_lessons + v_quizzes) / 25) * 25,  -- round-number tier, step 25
    v_standard;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_class_progress() TO authenticated;
