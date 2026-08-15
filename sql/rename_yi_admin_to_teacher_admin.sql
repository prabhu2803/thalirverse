-- =======================================================
-- Renames the YI_ADMIN role to TEACHER_ADMIN — a name that reads better
-- for the school teachers/coordinators who actually hold this role.
-- SUPER_ADMIN is unchanged.
--
-- Run once in the Supabase SQL Editor. After this, re-run
-- sql/enable_rls.sql (it has already been updated to check
-- TEACHER_ADMIN) if you have RLS policies enabled — its is_admin()
-- function still checked the old value and would start rejecting
-- valid admins otherwise.
-- =======================================================

ALTER TYPE public.user_role RENAME VALUE 'YI_ADMIN' TO 'TEACHER_ADMIN';
