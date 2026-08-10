-- =======================================================
-- Removes email and date-of-birth from our own tables — neither is
-- collected at registration anymore. Supabase Auth still requires an
-- email internally for every account (a Supabase framework
-- constraint, not something we choose), so a hidden placeholder is
-- still generated at signup and stored ONLY in Supabase's own
-- auth.users table — never duplicated into public.profiles.
-- Run once in Supabase SQL Editor, AFTER sql/name_based_login.sql.
-- =======================================================

-- 1. Drop the now-unused columns.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
ALTER TABLE public.students DROP COLUMN IF EXISTS dob;

-- 2. Update the auth trigger so it no longer writes to the dropped columns.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, mobile, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'fullName', 'New Student'),
    NULL,
    'STUDENT'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.students (user_id, school_id, chapter_id, standard, section, gender, district, parent_name, parent_mobile)
  VALUES (
    new.id,
    null,
    null,
    COALESCE(new.raw_user_meta_data->>'standard', '6th Standard'),
    COALESCE(new.raw_user_meta_data->>'section', 'A'),
    COALESCE(new.raw_user_meta_data->>'gender', 'male'),
    NULLIF(COALESCE(new.raw_user_meta_data->>'district', ''), ''),
    NULLIF(COALESCE(new.raw_user_meta_data->>'parentName', ''), ''),
    NULLIF(COALESCE(new.raw_user_meta_data->>'parentMobile', ''), '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Point resolve_login_email() at auth.users (the only remaining
--    place an email exists) instead of the now-dropped profiles.email.
CREATE OR REPLACE FUNCTION public.resolve_login_email(p_full_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matches TEXT[];
BEGIN
  SELECT array_agg(u.email) INTO matches
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(trim(p.full_name)) = lower(trim(p_full_name));

  IF matches IS NULL OR array_length(matches, 1) <> 1 THEN
    RETURN NULL;
  END IF;

  RETURN matches[1];
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_email(TEXT) TO anon, authenticated;
