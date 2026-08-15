-- =======================================================
-- Self-service password reset via a security question, since
-- students (and admins) log in by name and have no reachable real
-- email/phone for a standard reset-link flow.
--
-- Works for ANY role (student, TEACHER_ADMIN, SUPER_ADMIN) — it's keyed
-- only on full_name + the answer hash, nothing role-specific.
-- Run once in Supabase SQL Editor.
-- =======================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS security_question TEXT,
  ADD COLUMN IF NOT EXISTS security_answer_hash TEXT;

-- Sets/updates the calling (authenticated) user's own security question.
-- The answer is hashed here, in the database — never stored or compared
-- as plaintext anywhere in application code.
CREATE OR REPLACE FUNCTION public.set_security_answer(p_question TEXT, p_answer TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET security_question = p_question,
      security_answer_hash = encode(digest(lower(trim(p_answer)), 'sha256'), 'hex')
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_security_answer(TEXT, TEXT) TO authenticated;

-- Public lookup (unauthenticated — this is the forgot-password flow):
-- returns the security question text for a name, only when it resolves
-- to exactly one account that has one set. Never returns the answer.
CREATE OR REPLACE FUNCTION public.get_security_question(p_full_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matches TEXT[];
BEGIN
  SELECT array_agg(security_question) INTO matches
  FROM public.profiles
  WHERE lower(trim(full_name)) = lower(trim(p_full_name))
    AND security_question IS NOT NULL;

  IF matches IS NULL OR array_length(matches, 1) <> 1 THEN
    RETURN NULL;
  END IF;

  RETURN matches[1];
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_security_question(TEXT) TO anon, authenticated;

-- Public verification (unauthenticated): returns the matching profile's
-- id only when the name resolves uniquely AND the hashed answer matches.
-- The server route uses this id + the service role key to actually set
-- the new password — this function never touches auth.users itself.
CREATE OR REPLACE FUNCTION public.verify_security_answer(p_full_name TEXT, p_answer TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_id UUID;
BEGIN
  SELECT id INTO matched_id
  FROM public.profiles
  WHERE lower(trim(full_name)) = lower(trim(p_full_name))
    AND security_answer_hash IS NOT NULL
    AND security_answer_hash = encode(digest(lower(trim(p_answer)), 'sha256'), 'hex')
  LIMIT 1;

  RETURN matched_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_security_answer(TEXT, TEXT) TO anon, authenticated;
