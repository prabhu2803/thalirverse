-- =======================================================
-- Promotes a student account to YI_ADMIN or SUPER_ADMIN.
--
-- Do NOT create admin accounts by inserting into auth.users directly —
-- that bypasses bookkeeping tables (e.g. auth.identities) Supabase's
-- Auth service needs for password sign-in, and causes a
-- "Database error querying schema" 500 on login. Ask us how we know.
--
-- Correct steps:
--   1. Register the account normally through /register, using the
--      exact name you want as the login name (e.g. "Yi Admin (Madurai)"
--      or "Super Admin") and any password.
--   2. Run the matching UPDATE below in the Supabase SQL Editor.
-- =======================================================

UPDATE public.profiles SET role = 'YI_ADMIN'    WHERE full_name = 'Yi Admin (Madurai)';
UPDATE public.profiles SET role = 'SUPER_ADMIN' WHERE full_name = 'Super Admin';
