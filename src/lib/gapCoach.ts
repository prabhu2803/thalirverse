// Thalir Gap Coach — the Gemini call itself. Server-only: reads
// GEMINI_API_KEY from process.env, so this file must never be imported
// from a 'use client' component (same rule src/lib/supabaseAdmin.ts
// documents for the Supabase service-role key). Only ever called from
// src/app/api/gap-coach/generate/route.ts.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export interface ConceptInput {
  tag: string;
  title: string;
  source: string;
}

export interface GapExplanationResult {
  grounded: boolean;
  explanation: string | null;
  supporting_quote: string | null;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Generates a short, grounded remedial explanation for one missed concept.
// Never fabricates: the model must cite a verbatim quote from the source
// material, and that quote is mechanically checked to actually appear in
// the source before the explanation is trusted — the model's own
// self-reported "grounded" flag is never taken at face value alone. If
// anything about the check fails, this returns grounded: false rather
// than throwing, so a single ungroundable concept never breaks the whole
// batch (see the route, which calls this per-concept).
export async function generateGapExplanation(
  concept: ConceptInput,
  studentAnswerText: string,
  correctAnswerText: string
): Promise<GapExplanationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');

  const prompt = `You are a remedial tutor for a school youth-development programme. A student got a quiz question wrong.

Concept: ${concept.title}
Source material (the ONLY thing you may use — never add outside facts, examples, or claims not present here):
"""${concept.source}"""

Student's wrong answer: "${studentAnswerText}"
Correct answer: "${correctAnswerText}"

Write a short (max 3 sentences), encouraging, plain-language explanation of this concept for a school student, using ONLY the source material above. Then quote the exact sentence or phrase from the source material that supports your explanation, copied verbatim, word for word.

If the source material is insufficient to confidently explain this without adding outside information, set "grounded" to false and leave "explanation" and "supporting_quote" empty strings.

Respond as JSON only, no other text: {"grounded": boolean, "explanation": string, "supporting_quote": string}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    }
  );

  if (!res.ok) {
    return { grounded: false, explanation: null, supporting_quote: null };
  }

  try {
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { grounded: false, explanation: null, supporting_quote: null };

    const parsed = JSON.parse(text);
    const quote = typeof parsed.supporting_quote === 'string' ? parsed.supporting_quote : '';

    // Mechanical grounding check — a real citation-verification step, not
    // just an instruction the model might ignore. The cited quote must
    // actually appear (normalized) in the source material.
    const quoteFound = quote.length > 0 && normalize(concept.source).includes(normalize(quote));
    const grounded = !!parsed.grounded && quoteFound;

    return {
      grounded,
      explanation: grounded && typeof parsed.explanation === 'string' ? parsed.explanation : null,
      supporting_quote: grounded ? quote : null,
    };
  } catch {
    return { grounded: false, explanation: null, supporting_quote: null };
  }
}
