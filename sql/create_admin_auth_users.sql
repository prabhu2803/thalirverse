-- =======================================================
-- Create admin auth users with password '1234'
-- Run once in Supabase SQL Editor
-- =======================================================

-- First, delete manually inserted admin profiles (trigger will recreate them)
DELETE FROM public.students WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);
DELETE FROM public.profiles WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);

-- Update trigger to safely handle existing profiles (won't fail on conflict)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
INSERT INTO public.profiles (id, full_name, mobile, role)
  VALUES (
    new.id,
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
    CASE WHEN new.email = 'admin@yi.org' THEN 'Organizer' WHEN new.email = 'superadmin@yi.org' THEN 'Director' ELSE COALESCE(new.raw_user_meta_data->>'standard', '6th Standard') END,
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

-- Create admin auth users with password '1234'
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_user_meta_data, created_at, updated_at, last_sign_in_at)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  'd7a5e5f0-0001-4000-8000-000000000001'::uuid,
  'authenticated',
  'authenticated',
  'admin@yi.org',
  crypt('1234', gen_salt('bf')),
  now(),
  now(),
  '{"fullName":"Yi Admin (Madurai)"}'::jsonb,
  now(),
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@yi.org');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_user_meta_data, created_at, updated_at, last_sign_in_at)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  'd7a5e5f0-0002-4000-8000-000000000002'::uuid,
  'authenticated',
  'authenticated',
  'superadmin@yi.org',
  crypt('1234', gen_salt('bf')),
  now(),
  now(),
  '{"fullName":"Super Admin"}'::jsonb,
  now(),
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@yi.org');
