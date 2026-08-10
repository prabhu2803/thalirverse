-- =======================================================
-- Creates the Yi Admin and Super Admin accounts, compatible with the
-- current schema (name-based login, no profiles.email/students.dob).
-- Replaces the old sql/create_admin_auth_users.sql + admin_seed.sql,
-- which reference columns that no longer exist.
--
-- Login name for each account is exactly the fullName below.
-- CHANGE THE PASSWORD below before running, or change it afterwards
-- via Edit Profile once logged in.
-- Run once in Supabase SQL Editor.
-- =======================================================

-- ── Yi Admin (Madurai) ──────────────────────────────────
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_sent_at, raw_user_meta_data,
  created_at, updated_at, last_sign_in_at
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'yi-admin-madurai@admins.thalirverse.internal',
  crypt('ChangeMe123!', gen_salt('bf')),
  now(), now(),
  '{"fullName":"Yi Admin (Madurai)"}'::jsonb,
  now(), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE full_name = 'Yi Admin (Madurai)');

UPDATE public.profiles SET role = 'YI_ADMIN' WHERE full_name = 'Yi Admin (Madurai)';

-- ── Super Admin ──────────────────────────────────────────
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_sent_at, raw_user_meta_data,
  created_at, updated_at, last_sign_in_at
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'super-admin@admins.thalirverse.internal',
  crypt('ChangeMe123!', gen_salt('bf')),
  now(), now(),
  '{"fullName":"Super Admin"}'::jsonb,
  now(), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE full_name = 'Super Admin');

UPDATE public.profiles SET role = 'SUPER_ADMIN' WHERE full_name = 'Super Admin';
