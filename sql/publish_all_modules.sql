-- Publish all existing modules so students can see them
-- Run this once in the Supabase SQL Editor
UPDATE public.modules SET is_published = true WHERE is_published = false;
