-- =======================================================
-- FIX: Correct trigger column name (raw_user_meta_data)
-- Run this in Supabase SQL Editor
-- =======================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, mobile, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'fullName', 'New Student'),
    NULL,
    'STUDENT'
  );

  INSERT INTO public.students (user_id, school_id, chapter_id, standard, section, gender, dob, district, parent_name, parent_mobile)
  VALUES (
    new.id,
    null,
    null,
    COALESCE(new.raw_user_meta_data->>'standard', '6th Standard'),
    COALESCE(new.raw_user_meta_data->>'section', 'A'),
    COALESCE(new.raw_user_meta_data->>'gender', 'male'),
    null,
    COALESCE(new.raw_user_meta_data->>'district', ''),
    COALESCE(new.raw_user_meta_data->>'parentName', ''),
    COALESCE(new.raw_user_meta_data->>'parentMobile', '')
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
