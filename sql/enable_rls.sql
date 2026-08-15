-- =======================================================
-- ENABLE RLS ON ALL PUBLIC TABLES
-- Run this in the Supabase SQL Editor.
-- This replaces disable_rls.sql — do not run both.
-- =======================================================

-- ── Helper: admin role check ────────────────────────────────────────────────
-- SECURITY DEFINER runs as postgres (bypasses RLS on profiles, no recursion).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('TEACHER_ADMIN', 'SUPER_ADMIN')
  );
$$;

-- ── Drop existing policies before recreating ────────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','chapters','schools','students','modules',
                        'lessons','quizzes','questions','answers',
                        'progress','quiz_attempts','certificates','chat_messages')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ── profiles ────────────────────────────────────────────────────────────────
-- Students see & edit their own row. Admins see & manage all rows.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- ── chapters (reference — all authenticated users read; admins write) ────────
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chapters_select" ON public.chapters
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "chapters_insert" ON public.chapters
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "chapters_update" ON public.chapters
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "chapters_delete" ON public.chapters
  FOR DELETE USING (public.is_admin());

-- ── schools (reference — all authenticated users read; admins write) ─────────
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools_select" ON public.schools
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "schools_insert" ON public.schools
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "schools_update" ON public.schools
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "schools_delete" ON public.schools
  FOR DELETE USING (public.is_admin());

-- ── students (extended profile — own row or admin) ──────────────────────────
-- The handle_new_user() trigger is SECURITY DEFINER, so it bypasses RLS on insert.
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_select" ON public.students
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "students_insert" ON public.students
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "students_update" ON public.students
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "students_delete" ON public.students
  FOR DELETE USING (public.is_admin());

-- ── modules (published content read by all; admins see & write all) ──────────
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_select" ON public.modules
  FOR SELECT USING (is_published = true OR public.is_admin());

CREATE POLICY "modules_insert" ON public.modules
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "modules_update" ON public.modules
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "modules_delete" ON public.modules
  FOR DELETE USING (public.is_admin());

-- ── lessons (read by all authenticated; admins write) ───────────────────────
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_select" ON public.lessons
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "lessons_insert" ON public.lessons
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "lessons_update" ON public.lessons
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "lessons_delete" ON public.lessons
  FOR DELETE USING (public.is_admin());

-- ── quizzes (published quizzes read by all; admins see & write all) ──────────
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes_select" ON public.quizzes
  FOR SELECT USING (is_published = true OR public.is_admin());

CREATE POLICY "quizzes_insert" ON public.quizzes
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "quizzes_update" ON public.quizzes
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "quizzes_delete" ON public.quizzes
  FOR DELETE USING (public.is_admin());

-- ── questions (read by all authenticated; admins write) ─────────────────────
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select" ON public.questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "questions_insert" ON public.questions
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "questions_update" ON public.questions
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "questions_delete" ON public.questions
  FOR DELETE USING (public.is_admin());

-- ── answers (read by all authenticated; admins write) ───────────────────────
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "answers_select" ON public.answers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "answers_insert" ON public.answers
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "answers_update" ON public.answers
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "answers_delete" ON public.answers
  FOR DELETE USING (public.is_admin());

-- ── progress (own rows; admins read all for analytics) ──────────────────────
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_select" ON public.progress
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "progress_insert" ON public.progress
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "progress_update" ON public.progress
  FOR UPDATE USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "progress_delete" ON public.progress
  FOR DELETE USING (student_id = auth.uid() OR public.is_admin());

-- ── quiz_attempts (own rows; admins read all for analytics) ─────────────────
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_attempts_select" ON public.quiz_attempts
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "quiz_attempts_insert" ON public.quiz_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "quiz_attempts_delete" ON public.quiz_attempts
  FOR DELETE USING (public.is_admin());

-- ── certificates (own rows or admin) ────────────────────────────────────────
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificates_select" ON public.certificates
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "certificates_insert" ON public.certificates
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "certificates_update" ON public.certificates
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "certificates_delete" ON public.certificates
  FOR DELETE USING (public.is_admin());

-- ── chat_messages (locked to admins until feature is built) ─────────────────
-- Table exists in Supabase but has no app code yet. Enabling RLS with admin-only
-- access silences the security warning and keeps data safe until policies are
-- updated when the chat feature is implemented.
-- When ready, replace with per-user policies using your user_id/sender_id column.
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_admin_only" ON public.chat_messages
  FOR ALL USING (public.is_admin());
