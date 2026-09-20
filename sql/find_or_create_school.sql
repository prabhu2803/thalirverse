-- =======================================================
-- Fixes registration for any student whose school isn't in the directory
-- yet. dataService.signUp() calls findOrCreateSchoolId() BEFORE the caller
-- is authenticated (it runs ahead of supabase.auth.signUp()), and even
-- after authenticating, a plain STUDENT still isn't an admin — but
-- schools_insert (sql/enable_rls.sql) only allows admins to INSERT.
-- Every registration with a genuinely new school name has therefore been
-- failing with "new row violates row-level security policy for table
-- schools", even though the register page's own UI explicitly invites
-- typing in a new one ("...or enter a new one").
--
-- This SECURITY DEFINER RPC does the same find-or-create as the old
-- client-side logic, but atomically and bypassing RLS — schools_insert
-- itself stays admin-only for any OTHER, non-signup write path.
-- Run once in Supabase SQL Editor.
-- =======================================================

CREATE OR REPLACE FUNCTION public.find_or_create_school(p_name TEXT, p_district TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trimmed    TEXT := trim(p_name);
  v_school_id  UUID;
  v_chapter_id UUID;
BEGIN
  IF v_trimmed = '' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_school_id FROM public.schools WHERE lower(name) = lower(v_trimmed) LIMIT 1;
  IF v_school_id IS NOT NULL THEN
    RETURN v_school_id;
  END IF;

  SELECT id INTO v_chapter_id FROM public.chapters
    WHERE lower(name) = lower(trim(COALESCE(p_district, ''))) LIMIT 1;

  INSERT INTO public.schools (name, city, district, chapter_id)
  VALUES (
    v_trimmed,
    COALESCE(NULLIF(trim(p_district), ''), 'Unknown'),
    COALESCE(NULLIF(trim(p_district), ''), 'Unknown'),
    v_chapter_id
  )
  -- Atomic race-condition handling: if a concurrent signup created the
  -- same school between our lookup and this insert, land on that row
  -- instead of erroring, replacing the old client-side catch-and-retry.
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_school_id;

  RETURN v_school_id;
END;
$$;

-- anon: dataService.signUp() calls this before auth.signUp() completes.
GRANT EXECUTE ON FUNCTION public.find_or_create_school(TEXT, TEXT) TO anon, authenticated;
