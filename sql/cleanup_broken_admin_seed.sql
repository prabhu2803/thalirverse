-- =======================================================
-- One-time cleanup: removes the two broken admin accounts created by
-- the old (incorrect) sql/seed_admins.sql, which inserted into
-- auth.users directly and left them unable to sign in.
-- Run once in Supabase SQL Editor, then follow the new
-- sql/seed_admins.sql instructions to recreate them properly.
--
-- public.profiles has no FK to auth.users in this schema, so each
-- table needs an explicit delete (students -> profiles -> auth.users,
-- respecting students.user_id's FK to profiles).
-- =======================================================

DELETE FROM public.students
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN (
    'yi-admin-madurai@admins.thalirverse.internal',
    'super-admin@admins.thalirverse.internal'
  )
);

DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email IN (
    'yi-admin-madurai@admins.thalirverse.internal',
    'super-admin@admins.thalirverse.internal'
  )
);

DELETE FROM auth.users
WHERE email IN (
  'yi-admin-madurai@admins.thalirverse.internal',
  'super-admin@admins.thalirverse.internal'
);
