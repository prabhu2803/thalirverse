-- =======================================================
-- THALIRVERSE ADMIN SEED MIGRATION
-- Run this in Supabase SQL Editor to create admin profiles
-- =======================================================

-- Insert admin profiles directly (profiles has no FK to auth.users)
INSERT INTO public.profiles (id, full_name, mobile, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Yi Admin (Madurai)', NULL, 'YI_ADMIN'),
  ('00000000-0000-0000-0000-000000000002', 'Super Admin', NULL, 'SUPER_ADMIN')
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding student records for admin dashboards
INSERT INTO public.students (id, user_id, school_id, chapter_id, standard, section)
SELECT 'adm-0001', '00000000-0000-0000-0000-000000000001', NULL, id, 'Organizer', 'Admin'
FROM public.chapters WHERE name = 'Madurai'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.students (id, user_id, chapter_id, standard, section) VALUES
  ('adm-0002', '00000000-0000-0000-0000-000000000002', NULL, 'Director', 'Admin')
ON CONFLICT (id) DO NOTHING;
