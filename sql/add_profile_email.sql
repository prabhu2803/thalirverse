-- =======================================================
-- Add email to profiles and backfill existing users
-- Run this in Supabase SQL Editor
-- =======================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE public.profiles
ALTER COLUMN mobile DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key
ON public.profiles (email)
WHERE email IS NOT NULL;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, mobile, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'fullName', 'New Student'),
    NULL,
    CASE 
      WHEN new.email = 'admin@yi.org' THEN 'YI_ADMIN'::public.user_role
      WHEN new.email = 'superadmin@yi.org' THEN 'SUPER_ADMIN'::public.user_role
      ELSE 'STUDENT'::public.user_role
    END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.students (user_id, school_id, chapter_id, standard, section, gender, dob, district, parent_name, parent_mobile)
  VALUES (
    new.id,
    null,
    (SELECT id FROM public.chapters WHERE name = 'Madurai' LIMIT 1),
    CASE
      WHEN new.email = 'admin@yi.org' THEN 'Organizer'
      WHEN new.email = 'superadmin@yi.org' THEN 'Director'
      ELSE COALESCE(new.raw_user_meta_data->>'standard', '6th Standard')
    END,
    'Admin',
    'male',
    null,
    '',
    '',
    ''
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
