-- =======================================================
-- Storage bucket + RLS for PDF/PowerPoint lesson content.
--
-- Public-read (matches that YouTube lesson content is already effectively
-- public; also required so the Microsoft Office Online embed viewer can
-- fetch a .pptx file server-side without auth), admin-only write.
--
-- IMPORTANT: unlike sql/enable_rls.sql's DROP-policies loop (which only
-- iterates public-schema tables via `pg_policies WHERE schemaname =
-- 'public'`), storage.objects/storage.buckets live in the `storage` schema
-- and are never touched by that loop. This file's own DROP-before-CREATE
-- pairs are the only thing making these policies idempotent — keep any
-- future edit here in that same form, or a re-run will fail with
-- "policy already exists" (exactly what happened once already on
-- chat_messages in enable_rls.sql before that table was added to its loop).
-- Run once in Supabase SQL Editor.
-- =======================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-content', 'lesson-content', true,
  26214400, -- 25 MB: generous for a PDF/PPTX deck, small enough to keep upload UX
            -- snappy on school wifi and the Office Online embed responsive
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- .pptx
    'application/vnd.ms-powerpoint' -- legacy .ppt
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- storage.objects is owned by Supabase's internal supabase_storage_admin
-- role, not this project's role — running ALTER TABLE ... ENABLE ROW LEVEL
-- SECURITY on it fails with "must be owner of table objects" even for a
-- project owner. Not needed anyway: Supabase already has RLS enabled on
-- storage.objects by default in every project. Policies can still be
-- created on it normally, which is all this file needs to do.

DROP POLICY IF EXISTS "storage_objects_lesson_content_select" ON storage.objects;
CREATE POLICY "storage_objects_lesson_content_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'lesson-content');

DROP POLICY IF EXISTS "storage_objects_lesson_content_insert" ON storage.objects;
CREATE POLICY "storage_objects_lesson_content_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'lesson-content' AND public.is_admin());

DROP POLICY IF EXISTS "storage_objects_lesson_content_update" ON storage.objects;
CREATE POLICY "storage_objects_lesson_content_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'lesson-content' AND public.is_admin());

DROP POLICY IF EXISTS "storage_objects_lesson_content_delete" ON storage.objects;
CREATE POLICY "storage_objects_lesson_content_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'lesson-content' AND public.is_admin());
