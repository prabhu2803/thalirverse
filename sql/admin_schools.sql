-- =======================================================
-- Links admin accounts (TEACHER_ADMIN / SUPER_ADMIN) to the schools they
-- cover. Many-to-many: one admin can be assigned to several schools,
-- and a school can have more than one admin.
-- Run once in Supabase SQL Editor.
-- =======================================================

CREATE TABLE IF NOT EXISTS public.admin_schools (
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (admin_id, school_id)
);
