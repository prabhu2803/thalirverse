import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateGapExplanation } from '@/lib/gapCoach';

// Thalir Gap Coach — reads a quiz attempt's wrong answers, generates a
// short grounded remedial explanation per distinct missed concept via
// Gemini, and persists the results. Called fire-and-forget from the quiz
// results page; must never throw in a way the caller can't just ignore —
// this is an addition to the flow, never a gate on it.
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 });
  }

  let admin: ReturnType<typeof getSupabaseAdmin>;
  try {
    admin = getSupabaseAdmin();
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server misconfigured.' }, { status: 500 });
  }

  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }

  let body: { attempt_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const attemptId = body.attempt_id || '';
  if (!attemptId) {
    return NextResponse.json({ error: 'attempt_id is required.' }, { status: 400 });
  }

  const { data: attempt } = await admin.from('quiz_attempts').select('id, student_id').eq('id', attemptId).single();
  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });
  }

  // Only the student who owns this attempt (or an admin) may trigger generation for it.
  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = callerProfile && ['TEACHER_ADMIN', 'SUPER_ADMIN'].includes(callerProfile.role);
  if (attempt.student_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized for this attempt.' }, { status: 403 });
  }

  try {
    const { data: wrongAnswers } = await admin
      .from('quiz_attempt_answers')
      .select('question_id, concept_tag, selected_answer_id')
      .eq('attempt_id', attemptId)
      .eq('is_correct', false);

    if (!wrongAnswers || wrongAnswers.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Dedupe by concept_tag — a student can only miss each concept once per
    // attempt today (one question per concept), but this keeps working
    // correctly once a module has multiple questions per concept.
    const missedByConcept = new Map<string, { questionId: string; selectedAnswerId: string | null }>();
    wrongAnswers.forEach(w => {
      if (w.concept_tag && !missedByConcept.has(w.concept_tag)) {
        missedByConcept.set(w.concept_tag, { questionId: w.question_id, selectedAnswerId: w.selected_answer_id });
      }
    });
    if (missedByConcept.size === 0) {
      // Questions were missed but have no concept_tag assigned yet — nothing to ground against.
      return NextResponse.json({ results: [] });
    }

    const conceptTags = [...missedByConcept.keys()];
    const questionIds = [...missedByConcept.values()].map(v => v.questionId);

    const [{ data: concepts }, { data: questions }, { data: answers }, { data: modules }] = await Promise.all([
      admin.from('concept_content').select('concept_tag, module_id, title, source_excerpt').in('concept_tag', conceptTags),
      admin.from('questions').select('id, order_index, concept_tag').in('id', questionIds),
      admin.from('answers').select('id, question_id, answer_text, is_correct').in('question_id', questionIds),
      admin.from('modules').select('id, order_index'),
    ]);

    const conceptByTag = new Map((concepts ?? []).map(c => [c.concept_tag, c]));
    const questionById = new Map((questions ?? []).map(q => [q.id, q]));
    const moduleOrderById = new Map((modules ?? []).map(m => [m.id, m.order_index]));
    const answersByQuestion = new Map<string, { id: string; answer_text: string; is_correct: boolean }[]>();
    (answers ?? []).forEach(a => {
      const list = answersByQuestion.get(a.question_id);
      if (list) list.push(a); else answersByQuestion.set(a.question_id, [a]);
    });

    // Priority: earlier-in-curriculum concepts are more foundational, so
    // they rank first — a deterministic proxy that doesn't need another
    // model call. Module order_index first, then question order_index.
    const ranked = conceptTags
      .map(tag => {
        const concept = conceptByTag.get(tag);
        const missed = missedByConcept.get(tag)!;
        const question = questionById.get(missed.questionId);
        const moduleOrder = concept ? moduleOrderById.get(concept.module_id) ?? 99 : 99;
        return { tag, concept, missed, question, sortKey: moduleOrder * 1000 + (question?.order_index ?? 99) };
      })
      .sort((a, b) => a.sortKey - b.sortKey);

    const results: { concept_tag: string; title: string; explanation: string; priority: number }[] = [];
    const rowsToInsert: Record<string, any>[] = [];
    let priority = 1;

    for (const item of ranked) {
      if (!item.concept) continue; // no source content authored for this concept — never guess
      const answerList = answersByQuestion.get(item.missed.questionId) ?? [];
      const studentAnswer = answerList.find(a => a.id === item.missed.selectedAnswerId);
      const correctAnswer = answerList.find(a => a.is_correct);
      if (!correctAnswer) continue;

      const generated = await generateGapExplanation(
        { tag: item.tag, title: item.concept.title, source: item.concept.source_excerpt },
        studentAnswer?.answer_text ?? '(no answer selected)',
        correctAnswer.answer_text
      );

      rowsToInsert.push({
        attempt_id: attemptId,
        student_id: attempt.student_id,
        concept_tag: item.tag,
        explanation: generated.explanation,
        priority: generated.grounded ? priority : null,
        grounded: generated.grounded,
        supporting_quote: generated.supporting_quote,
      });

      if (generated.grounded && generated.explanation) {
        results.push({ concept_tag: item.tag, title: item.concept.title, explanation: generated.explanation, priority });
        priority++;
      }
    }

    if (rowsToInsert.length > 0) {
      await admin.from('gap_coach_explanations').insert(rowsToInsert);
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    // Never let a Gemini/network failure look like a broken quiz flow to
    // the caller — the results page treats any non-200 as "show nothing extra."
    return NextResponse.json({ error: err?.message || 'Gap Coach generation failed.' }, { status: 500 });
  }
}
