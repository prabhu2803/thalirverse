-- =======================================================
-- Enables login by full name + password instead of email.
-- Supabase Auth still requires an email internally (the app now
-- generates a hidden placeholder one at signup), so login needs a
-- way to resolve "name typed by student" -> "email to authenticate
-- with" WITHOUT exposing the profiles table to anonymous users.
--
-- This function returns the email for an exact (case-insensitive)
-- full_name match — and only when the match is unique. If zero or
-- multiple students share that name, it returns NULL and the app
-- shows a "couldn't find a single account" message.
-- Run once in Supabase SQL Editor.
-- =======================================================

CREATE OR REPLACE FUNCTION public.resolve_login_email(p_full_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matches TEXT[];
BEGIN
  SELECT array_agg(email) INTO matches
  FROM public.profiles
  WHERE lower(trim(full_name)) = lower(trim(p_full_name))
    AND email IS NOT NULL;

  IF matches IS NULL OR array_length(matches, 1) <> 1 THEN
    RETURN NULL;
  END IF;

  RETURN matches[1];
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_email(TEXT) TO anon, authenticated;
