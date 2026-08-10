-- =======================================================
-- THALIRVERSE DATABASE SCHEMA MIGRATION
-- Built for Supabase (PostgreSQL)
-- =======================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Chapters
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  city VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Schools
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  coordinator_name VARCHAR(100),
  coordinator_mobile VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Profiles (Extends Supabase auth.users)
CREATE TYPE public.user_role AS ENUM ('STUDENT', 'YI_ADMIN', 'SUPER_ADMIN');

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- Will map to auth.users.id
  full_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) UNIQUE,
  role public.user_role DEFAULT 'STUDENT',
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Student Profiles
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  standard VARCHAR(50) NOT NULL, -- e.g., "11th Standard"
  section VARCHAR(10) DEFAULT 'A',
  gender VARCHAR(20) DEFAULT 'male',
  district VARCHAR(100),
  parent_name VARCHAR(100),
  parent_mobile VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Modules (Learning Tracks)
CREATE TABLE IF NOT EXISTS public.modules (
  id VARCHAR(100) PRIMARY KEY, -- e.g., 'road-safety', 'masoom', 'entrepreneurship'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  badge_id VARCHAR(100) NOT NULL,
  badge_title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Lessons
CREATE TYPE public.lesson_type AS ENUM ('VIDEO', 'PRESENTATION', 'PDF', 'TEXT');

CREATE TABLE IF NOT EXISTS public.lessons (
  id VARCHAR(100) PRIMARY KEY, -- e.g., 'rs-1', 'ms-1'
  module_id VARCHAR(100) REFERENCES public.modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  lesson_type public.lesson_type DEFAULT 'VIDEO',
  content_url TEXT NOT NULL, -- YouTube Link, etc.
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id VARCHAR(100) PRIMARY KEY, -- e.g., 'quiz-rs', 'quiz-ms'
  module_id VARCHAR(100) REFERENCES public.modules(id) ON DELETE CASCADE UNIQUE,
  title VARCHAR(255) NOT NULL,
  pass_percentage INTEGER DEFAULT 80,
  retry_limit INTEGER DEFAULT 3,
  time_limit_seconds INTEGER NOT NULL DEFAULT 300,
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Questions
CREATE TABLE IF NOT EXISTS public.questions (
  id VARCHAR(100) PRIMARY KEY, -- e.g., 'q-rs-1'
  quiz_id VARCHAR(100) REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- 9. Answers
CREATE TABLE IF NOT EXISTS public.answers (
  id VARCHAR(100) PRIMARY KEY, -- e.g., 'a1', 'a2'
  question_id VARCHAR(100) REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false
);

-- 10. Student Progress Tracker (Lesson watches)
CREATE TYPE public.progress_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE IF NOT EXISTS public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id VARCHAR(100) REFERENCES public.modules(id) ON DELETE CASCADE,
  lesson_id VARCHAR(100) REFERENCES public.lessons(id) ON DELETE CASCADE,
  status public.progress_status DEFAULT 'NOT_STARTED',
  watch_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, lesson_id)
);

-- 11. Quiz Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id VARCHAR(100) REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Certificates Issued
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. "TV-2026-MAD-XXXXX"
  title VARCHAR(255) DEFAULT 'Thalir Graduate',
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  pdf_url TEXT,
  verification_qr_url TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE'
);


-- =======================================================
-- AUTOMATIC AUTH ONBOARDING TRIGGERS (Supabase native)
-- =======================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles (safe: ignore duplicate id)
  INSERT INTO public.profiles (id, full_name, mobile, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'fullName', 'New Student'),
    NULL,
    'STUDENT'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into students metadata (safe: ignore duplicate user_id)
  INSERT INTO public.students (user_id, school_id, chapter_id, standard, section, gender, district, parent_name, parent_mobile)
  VALUES (
    new.id,
    null, -- Mapped to school registry on update
    null, -- Mapped to chapter registry on update
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

-- Create the trigger linking Supabase Auth register events
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Students log in with name + password; Supabase Auth still needs an email
-- internally (the app generates a hidden placeholder at signup). This
-- resolves "name typed at login" -> "email to authenticate with" without
-- exposing the profiles table to anonymous users. Returns NULL (ambiguous
-- login) when zero or multiple students share that name. The email itself
-- only exists in Supabase's own auth.users table — it is never stored on
-- public.profiles.
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


-- =======================================================
-- INITIAL SEED RECORDS (Learning Syllabus)
-- =======================================================

-- Seeds: Chapters
INSERT INTO public.chapters (name, city) VALUES 
('Madurai', 'Madurai'),
('Chennai', 'Chennai'),
('Coimbatore', 'Coimbatore'),
('Trichy', 'Tiruchirappalli')
ON CONFLICT (name) DO NOTHING;

-- Seeds: Modules
INSERT INTO public.modules (id, title, description, category, order_index, is_published, badge_id, badge_title) VALUES
('road-safety', 'Road Safety', 'Essential road safety rules and guidelines for young students to navigate city streets securely.', 'Road Safety', 0, true, 'road-safety-champ', 'Road Safety Champion'),
('masoom', 'Masoom', 'Personal body safety, child safety awareness, and identifying safe vs. unsafe touches.', 'Masoom', 1, true, 'masoom-badge', 'Masoom Safety Badge'),
('entrepreneurship', 'Entrepreneurship 101', 'Learn the fundamentals of critical thinking, starting a business, and serving community needs.', 'Entrepreneurship', 2, true, 'entrepreneurship-badge', 'Young Entrepreneur Badge'),
('leadership', 'Leadership Explorer', 'Harness teamwork, emotional intelligence, public speaking, and leading community initiatives.', 'Leadership', 3, true, 'leadership-badge', 'Leadership Explorer Badge')
ON CONFLICT (id) DO NOTHING;

-- Seeds: Lessons
INSERT INTO public.lessons (id, module_id, title, lesson_type, content_url, order_index) VALUES
('rs-1', 'road-safety', 'Pedestrian Crossing & Signals', 'VIDEO', 'https://www.youtube.com/watch?v=R9KbeH_3Hok', 0),
('rs-2', 'road-safety', 'Traffic Signs & Lane Disciplines', 'VIDEO', 'https://www.youtube.com/watch?v=2Tz8A2E8m98', 1),
('ms-1', 'masoom', 'Safe and Unsafe Touches', 'VIDEO', 'https://www.youtube.com/watch?v=aGshf7_jD3I', 0),
('ms-2', 'masoom', 'The Safe Circle Concept', 'VIDEO', 'https://www.youtube.com/watch?v=F_f0XW8r8q8', 1),
('ep-1', 'entrepreneurship', 'Introduction to Startups', 'VIDEO', 'https://www.youtube.com/watch?v=FqChyVEPEOI', 0),
('ep-2', 'entrepreneurship', 'Market Research Basics', 'VIDEO', 'https://www.youtube.com/watch?v=b-hMkfQ6gEs', 1),
('ld-1', 'leadership', 'Core Leadership Styles', 'VIDEO', 'https://www.youtube.com/watch?v=17XmfeH8hR4', 0),
('ld-2', 'leadership', 'Effective Communication & Teamwork', 'VIDEO', 'https://www.youtube.com/watch?v=t_9XF6t_8m8', 1)
ON CONFLICT (id) DO NOTHING;

-- Seeds: Quizzes
INSERT INTO public.quizzes (id, module_id, title, pass_percentage, retry_limit, is_published) VALUES
('quiz-rs', 'road-safety', 'Road Safety Basics Quiz', 80, 3, true),
('quiz-ms', 'masoom', 'Masoom Safety Quiz', 80, 3, true),
('quiz-ep', 'entrepreneurship', 'Entrepreneurship Basics Quiz', 80, 3, true),
('quiz-ld', 'leadership', 'Leadership Skills Quiz', 80, 3, true)
ON CONFLICT (id) DO NOTHING;

-- Seeds: Questions & Answers
-- Road Safety
INSERT INTO public.questions (id, quiz_id, question_text, order_index) VALUES
('q-rs-1', 'quiz-rs', 'What does a flashing yellow traffic light mean?', 0),
('q-rs-2', 'quiz-rs', 'Which side of the road should pedestrians walk on if there is no sidewalk?', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.answers (id, question_id, answer_text, is_correct) VALUES
('a1', 'q-rs-1', 'Stop completely', false),
('a2', 'q-rs-1', 'Proceed with caution', true),
('a3', 'q-rs-1', 'Speed up to clear the intersection', false),
('a4', 'q-rs-1', 'Yield to pedestrians only', false),
('b1', 'q-rs-2', 'Facing oncoming traffic', true),
('b2', 'q-rs-2', 'In the direction of traffic', false),
('b3', 'q-rs-2', 'Directly in the middle of the street', false),
('b4', 'q-rs-2', 'Any side is fine', false)
ON CONFLICT (id) DO NOTHING;

-- Masoom
INSERT INTO public.questions (id, quiz_id, question_text, order_index) VALUES
('q-ms-1', 'quiz-ms', 'Who belongs in your "Safe Circle"?', 0),
('q-ms-2', 'quiz-ms', 'What should you do if someone gives you an unsafe touch?', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.answers (id, question_id, answer_text, is_correct) VALUES
('c1', 'q-ms-1', 'Strangers you meet at the park', false),
('c2', 'q-ms-1', 'A small group of trusted adults like parents or teachers', true),
('c3', 'q-ms-1', 'Anyone who offers you candy', false),
('c4', 'q-ms-1', 'Only older kids at school', false),
('d1', 'q-ms-2', 'Keep it a secret', false),
('d2', 'q-ms-2', 'Say NO, run away, and tell a trusted adult immediately', true),
('d3', 'q-ms-2', 'Ignore it and hope it does not happen again', false),
('d4', 'q-ms-2', 'Blame yourself', false)
ON CONFLICT (id) DO NOTHING;

-- Entrepreneurship
INSERT INTO public.questions (id, quiz_id, question_text, order_index) VALUES
('q-ep-1', 'quiz-ep', 'What is the first step in starting a business?', 0),
('q-ep-2', 'quiz-ep', 'What does "value proposition" mean?', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.answers (id, question_id, answer_text, is_correct) VALUES
('e1', 'q-ep-1', 'Hiring 100 people', false),
('e2', 'q-ep-1', 'Identifying a problem and doing Market Research', true),
('e3', 'q-ep-1', 'Spending all your money on ads', false),
('e4', 'q-ep-1', 'Renting a huge office', false),
('f1', 'q-ep-2', 'The price tag on your product', false),
('f2', 'q-ep-2', 'The unique benefit your product or service offers to customers', true),
('f3', 'q-ep-2', 'The location of your business', false),
('f4', 'q-ep-2', 'The legal contract with your partner', false)
ON CONFLICT (id) DO NOTHING;

-- Leadership
INSERT INTO public.questions (id, quiz_id, question_text, order_index) VALUES
('q-ld-1', 'quiz-ld', 'Which trait is most important for a modern leader?', 0),
('q-ld-2', 'quiz-ld', 'How should a good leader handle mistakes?', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.answers (id, question_id, answer_text, is_correct) VALUES
('g1', 'q-ld-1', 'Telling everyone what to do without listening', false),
('g2', 'q-ld-1', 'Empathy and active listening to empower others', true),
('g3', 'q-ld-1', 'Being the loudest voice in the room', false),
('g4', 'q-ld-1', 'Making all decisions completely alone', false),
('h1', 'q-ld-2', 'Blame team members immediately', false),
('h2', 'q-ld-2', 'Acknowledge the mistake, learn from it, and solve it together', true),
('h3', 'q-ld-2', 'Hide the mistake so no one finds out', false),
('h4', 'q-ld-2', 'Cancel the project', false)
ON CONFLICT (id) DO NOTHING;
