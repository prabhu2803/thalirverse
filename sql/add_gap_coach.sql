-- =======================================================
-- Thalir Gap Coach — concept-level quiz remediation.
--
-- Adds: a concept_tag per question, a persisted per-question-attempt
-- record (previously only ever existed transiently in sessionStorage on
-- the results page — see src/app/quiz/[id]/page.tsx's handleSubmit — so
-- retry-improvement tracking and a teacher gap summary were structurally
-- impossible before this), the grounding source content Gemini is allowed
-- to draw from, and the generated explanations themselves.
--
-- NOTE ON CONTENT: the 8 source_excerpt rows below are a first-pass draft
-- written directly from this app's existing quiz questions/answers, not
-- reviewed by a subject-matter expert. Before real student use, someone
-- should sign off on the Road Safety and Masoom excerpts specifically —
-- those are safety-critical content, not just "nice to have accurate."
--
-- Run once in Supabase SQL Editor.
-- =======================================================

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS concept_tag VARCHAR(100);

CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- denormalized for simple RLS
  question_id VARCHAR(100) REFERENCES public.questions(id) ON DELETE CASCADE,
  concept_tag VARCHAR(100), -- copied at write time so later question edits don't rewrite history
  selected_answer_id VARCHAR(100),
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.concept_content (
  concept_tag VARCHAR(100) PRIMARY KEY,
  module_id VARCHAR(100) REFERENCES public.modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  source_excerpt TEXT NOT NULL, -- the ONLY material Gemini may ground explanations in
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.gap_coach_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  concept_tag VARCHAR(100) NOT NULL,
  explanation TEXT, -- null if generation was skipped/ungrounded
  priority SMALLINT,
  grounded BOOLEAN NOT NULL DEFAULT false, -- true only once the citation-verification check passes
  supporting_quote TEXT, -- the verbatim snippet Gemini cited, kept for audit/debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_attempt_answers_select" ON public.quiz_attempt_answers;
CREATE POLICY "quiz_attempt_answers_select" ON public.quiz_attempt_answers
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "quiz_attempt_answers_insert" ON public.quiz_attempt_answers;
CREATE POLICY "quiz_attempt_answers_insert" ON public.quiz_attempt_answers
  FOR INSERT WITH CHECK (student_id = auth.uid());

ALTER TABLE public.concept_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "concept_content_select" ON public.concept_content;
CREATE POLICY "concept_content_select" ON public.concept_content
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "concept_content_insert" ON public.concept_content;
CREATE POLICY "concept_content_insert" ON public.concept_content
  FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "concept_content_update" ON public.concept_content;
CREATE POLICY "concept_content_update" ON public.concept_content
  FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "concept_content_delete" ON public.concept_content;
CREATE POLICY "concept_content_delete" ON public.concept_content
  FOR DELETE USING (public.is_admin());

ALTER TABLE public.gap_coach_explanations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gap_coach_explanations_select" ON public.gap_coach_explanations;
CREATE POLICY "gap_coach_explanations_select" ON public.gap_coach_explanations
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
-- No client INSERT policy: rows are written server-side only, from the
-- /api/gap-coach/generate route using the service-role key.

-- ── Concept-tagged source content (first-pass draft — see note above) ──
INSERT INTO public.concept_content (concept_tag, module_id, title, source_excerpt) VALUES
('traffic-signals', 'road-safety', 'Flashing Yellow Lights', 'A flashing yellow traffic light means proceed with caution — slow down, look both ways, and continue only when it''s safe. It is a warning to be careful, not a stop signal and not a green light to speed through.'),
('pedestrian-safety', 'road-safety', 'Walking Without a Sidewalk', 'When there is no sidewalk, always walk facing oncoming traffic, on the side of the road opposite to the direction vehicles are moving. This way you can see approaching vehicles and react in time, instead of being approached from behind.'),
('safe-circle', 'masoom', 'Your Safe Circle', 'Your Safe Circle is a small group of trusted adults — like your parents, guardians, or teachers — who you can always go to for help. It is not everyone you meet; strangers, even friendly ones offering gifts or candy, are never part of your Safe Circle.'),
('unsafe-touch-response', 'masoom', 'Responding to an Unsafe Touch', 'If someone gives you an unsafe touch, the right response is to say NO firmly, run away from the situation, and tell a trusted adult immediately. Never keep it a secret and never blame yourself — telling a trusted adult right away is always the safe choice.'),
('startup-first-step', 'entrepreneurship', 'Starting a Business', 'The first step in starting a business is identifying a real problem people have and doing market research to understand it — not hiring staff, renting an office, or spending on advertising before you even know what you''re building.'),
('value-proposition', 'entrepreneurship', 'What a Value Proposition Is', 'A value proposition is the unique benefit your product or service offers customers — why they should choose you. It is not your price, your business location, or any legal paperwork; it''s specifically about the value customers get.'),
('leadership-trait', 'leadership', 'What Makes a Modern Leader', 'The most important trait of a modern leader is empathy and active listening — understanding others and empowering them, rather than simply giving orders or being the loudest voice in the room.'),
('mistake-handling', 'leadership', 'Handling Mistakes as a Leader', 'A good leader responds to a mistake by acknowledging it, learning from it, and working with the team to solve it together — not by blaming others, hiding it, or cancelling the effort entirely.')
ON CONFLICT (concept_tag) DO UPDATE SET source_excerpt = EXCLUDED.source_excerpt, title = EXCLUDED.title, module_id = EXCLUDED.module_id;

UPDATE public.questions SET concept_tag = 'traffic-signals' WHERE id = 'q-rs-1';
UPDATE public.questions SET concept_tag = 'pedestrian-safety' WHERE id = 'q-rs-2';
UPDATE public.questions SET concept_tag = 'safe-circle' WHERE id = 'q-ms-1';
UPDATE public.questions SET concept_tag = 'unsafe-touch-response' WHERE id = 'q-ms-2';
UPDATE public.questions SET concept_tag = 'startup-first-step' WHERE id = 'q-ep-1';
UPDATE public.questions SET concept_tag = 'value-proposition' WHERE id = 'q-ep-2';
UPDATE public.questions SET concept_tag = 'leadership-trait' WHERE id = 'q-ld-1';
UPDATE public.questions SET concept_tag = 'mistake-handling' WHERE id = 'q-ld-2';
