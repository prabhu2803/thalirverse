-- =======================================================
-- Deletes every registered user — all students, admins, and their
-- progress/quiz/certificate history. Course content (chapters,
-- schools, modules, lessons, quizzes, questions, answers) is
-- untouched.
--
-- IRREVERSIBLE. Run once in Supabase SQL Editor.
-- =======================================================

-- profiles has no FK to auth.users in this schema, but students,
-- progress, quiz_attempts, and certificates all cascade from
-- profiles via ON DELETE CASCADE, so deleting profiles clears them too.
DELETE FROM public.profiles;

-- Now remove the underlying Supabase Auth accounts.
DELETE FROM auth.users;
