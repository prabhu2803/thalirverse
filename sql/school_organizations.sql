-- =======================================================
-- Adds an Organizations layer above Schools, for brands with
-- multiple campuses (e.g. "Greenwood High School" with a Madurai
-- campus and a Chennai campus) — each campus is still its own row in
-- public.schools, now optionally grouped under one organization.
--
-- Also links public.profiles to a real public.schools row instead of
-- (only) the free-text profiles.school column, and backfills that
-- link for every student already registered, creating a schools row
-- per distinct existing school name where one doesn't already exist.
--
-- Idempotent — safe to run more than once.
-- Run once in Supabase SQL Editor, after the earlier migrations.
-- =======================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- Backfill: one schools row per distinct existing free-text school name
-- (grouped case-insensitively), linked back onto every matching profile.
-- District majority-vote picks a chapter match where one exists.
DO $$
DECLARE
  rec RECORD;
  found_school_id UUID;
  matched_chapter_id UUID;
BEGIN
  FOR rec IN
    SELECT
      lower(trim(school)) AS school_key,
      mode() WITHIN GROUP (ORDER BY trim(school)) AS display_name,
      mode() WITHIN GROUP (ORDER BY trim(district)) AS common_district
    FROM public.profiles
    WHERE school IS NOT NULL AND trim(school) <> '' AND school_id IS NULL
    GROUP BY lower(trim(school))
  LOOP
    SELECT id INTO found_school_id FROM public.schools WHERE lower(name) = rec.school_key LIMIT 1;

    IF found_school_id IS NULL THEN
      SELECT id INTO matched_chapter_id FROM public.chapters
        WHERE lower(name) = lower(COALESCE(rec.common_district, '')) LIMIT 1;

      INSERT INTO public.schools (name, city, district, chapter_id)
      VALUES (
        rec.display_name,
        COALESCE(NULLIF(rec.common_district, ''), 'Unknown'),
        COALESCE(NULLIF(rec.common_district, ''), 'Unknown'),
        matched_chapter_id
      )
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id INTO found_school_id;
    END IF;

    UPDATE public.profiles
    SET school_id = found_school_id
    WHERE lower(trim(school)) = rec.school_key AND school_id IS NULL;
  END LOOP;
END $$;
