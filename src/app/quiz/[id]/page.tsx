'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dataService } from '@/lib/supabaseClient';

export default function QuizQuestion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router  = useRouter();

  const [student,      setStudent]     = useState<any>(null);
  const [course,       setCourse]      = useState<any>(null);
  const [quiz,         setQuiz]        = useState<any>(null);
  const [loading,      setLoading]     = useState(true);
  const [currentIdx,   setCurrentIdx]  = useState(0);
  const [selected,     setSelected]    = useState<string | null>(null);
  const [answers,      setAnswers]     = useState<Record<string, string>>({});
  const [reviewed,     setReviewed]    = useState<Set<string>>(new Set());
  const [timeLeft,     setTimeLeft]    = useState(300);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await dataService.getActiveStudent();
        setStudent(s);
        const c = await dataService.getModule(id);
        setCourse(c);
        if (c?.quiz) setQuiz(c.quiz);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [id]);

  useEffect(() => {
    if (loading || !quiz) return;
    const limit = quiz.time_limit_seconds ?? 300;
    setTimeLeft(limit);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, quiz]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const select = (qId: string, aId: string) => {
    setSelected(aId);
    setAnswers(prev => ({ ...prev, [qId]: aId }));
  };

  const toggleReview = (qId: string) => {
    setReviewed(prev => { const n = new Set(prev); n.has(qId) ? n.delete(qId) : n.add(qId); return n; });
  };

  const goTo = (i: number) => {
    setCurrentIdx(i);
    const qId = quiz.questions[i]?.id;
    setSelected(answers[qId] ?? null);
  };

  const next = () => {
    if (!quiz) return;
    const qs = quiz.questions ?? [];
    if (currentIdx < qs.length - 1) goTo(currentIdx + 1);
    else handleSubmit();
  };

  const prev = () => { if (currentIdx > 0) goTo(currentIdx - 1); };

  const handleSubmit = async () => {
    if (!student || !quiz) return;
    const qs = quiz.questions ?? [];
    let correct = 0;
    const breakdown: { questionId: string; userAnswerId: string | null; correctAnswerId: string; questionText: string }[] = [];
    qs.forEach((q: any) => {
      const userAns    = answers[q.id] ?? null;
      const correctAns = q.answers?.find((a: any) => a.is_correct);
      if (userAns && correctAns && userAns === correctAns.id) correct++;
      breakdown.push({ questionId: q.id, userAnswerId: userAns, correctAnswerId: correctAns?.id ?? '', questionText: q.question_text });
    });
    const total  = qs.length;
    const score  = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= (quiz.pass_percentage ?? 80);
    clearInterval(timerRef.current);
    await dataService.attemptQuiz(student.id, quiz.id, score, passed);
    sessionStorage.setItem(`quiz_result_${id}`, JSON.stringify({
      score, correct, total, passed, timeTaken: fmt(300 - timeLeft), breakdown,
    }));
    router.push(`/quiz/${id}/results`);
  };

  if (loading || !quiz) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
          <span className="animate-spin text-4xl">⏳</span>
          <span>Loading Assessment...</span>
        </div>
      </div>
    );
  }

  const qs      = quiz.questions ?? [];
  const current = qs[currentIdx];
  const total   = qs.length;
  const pct     = Math.round(((currentIdx + 1) / total) * 100);

  // Dot state for each question
  const dotState = (i: number) => {
    const q = qs[i];
    if (!q) return 'empty';
    if (i === currentIdx)   return 'current';
    if (reviewed.has(q.id)) return 'review';
    if (answers[q.id])      return 'answered';
    return 'empty';
  };

  const DOT_CLASSES: Record<string, string> = {
    current:  'bg-orange-500 text-white ring-2 ring-orange-300',
    answered: 'bg-orange-500/20 text-orange-600 border border-orange-400',
    review:   'bg-amber-100 text-amber-700 border border-amber-400',
    empty:    'bg-neutral-100 text-neutral-500 border border-neutral-200',
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-body text-neutral-900 flex flex-col">

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-100 h-14 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href={`/courses/${id}`}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1.5 rounded-full hover:bg-neutral-100">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <div>
            <p className="text-xs text-neutral-400 font-label">{course?.title}</p>
            <h1 className="text-sm font-headline font-bold text-neutral-800">{quiz.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSubmit}
            className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold text-neutral-500 hover:text-neutral-700 border border-neutral-200 hover:border-neutral-400 rounded-xl transition-all">
            Save Draft
          </button>
          <button onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-sm transition-all">
            Finish Attempt
          </button>
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black">
            {student?.fullName?.[0] ?? '?'}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* ── Left panel: timer + question progress ───────────── */}
        <aside className="hidden md:flex flex-col w-80 bg-white border-r border-neutral-200 p-6 gap-6 overflow-y-auto sticky top-14 h-[calc(100vh-3.5rem)]">
          {/* Timer */}
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
            <div className="flex items-center gap-2 text-orange-700 mb-1">
              <span className="material-symbols-outlined text-xl">timer</span>
              <span className="text-xs font-label font-bold uppercase tracking-wider">Time Remaining</span>
            </div>
            <p className={`text-3xl font-headline font-black tabular-nums ${timeLeft < 60 ? 'text-red-500' : 'text-orange-600'}`}>
              {fmt(timeLeft)}
            </p>
          </div>

          {/* Question progress dots */}
          <div>
            <p className="text-xs font-label font-bold uppercase tracking-widest text-neutral-400 mb-4">Question Progress</p>
            <div className="grid grid-cols-5 gap-2">
              {qs.map((_: any, i: number) => {
                const state = dotState(i);
                return (
                  <button key={i} onClick={() => goTo(i)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all hover:scale-105 ${DOT_CLASSES[state]}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {[
              { state: 'answered', label: 'Answered' },
              { state: 'current',  label: 'Current Question' },
              { state: 'empty',    label: 'Not Visited' },
              { state: 'review',   label: 'Review Later' },
            ].map(({ state, label }) => (
              <div key={state} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center ${DOT_CLASSES[state]}`} />
                <span className="text-[10px] text-neutral-500 font-label">{label}</span>
              </div>
            ))}
          </div>

          {/* Review later button */}
          {current && (
            <button onClick={() => toggleReview(current.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                reviewed.has(current.id)
                  ? 'bg-amber-50 text-amber-600 border-amber-300'
                  : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:border-amber-300 hover:text-amber-600'
              }`}>
              <span className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: reviewed.has(current.id) ? "'FILL' 1" : "'FILL' 0" }}>
                bookmark
              </span>
              {reviewed.has(current.id) ? 'Marked for Review' : 'Review Later'}
            </button>
          )}
        </aside>

        {/* ── Main question area ───────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">

            {/* Progress bar + question counter */}
            <div className="mb-10">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-orange-600">Question {currentIdx + 1} of {total}</span>
                <span className="text-sm font-medium text-neutral-400">{pct}% Completed</span>
              </div>
              <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Question card */}
            {current && (
              <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-8 mb-6">
                <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                  Multiple Choice
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-neutral-800 leading-tight">
                  {current.question_text}
                </h2>
              </div>
            )}

            {/* Answer options — 2-column grid */}
            {current && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {current.answers?.map((opt: any, idx: number) => {
                  const letter   = ['A', 'B', 'C', 'D'][idx] ?? String(idx + 1);
                  const isSel    = selected === opt.id;
                  return (
                    <button key={opt.id} onClick={() => select(current.id, opt.id)}
                      className={`relative flex items-center gap-4 p-6 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] ${
                        isSel
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-neutral-100 bg-white hover:border-orange-200 hover:bg-orange-50/30'
                      }`}>
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 transition-colors ${
                        isSel ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {letter}
                      </span>
                      <span className="text-base font-medium text-neutral-700 leading-snug">
                        {opt.answer_text ?? opt.text}
                      </span>
                      {isSel && (
                        <span className="ml-auto material-symbols-outlined text-orange-500 text-xl shrink-0"
                          style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom navigation */}
          <div className="pt-8 border-t border-neutral-200 flex justify-between items-center">
            <button onClick={prev} disabled={currentIdx === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 text-neutral-600 font-bold hover:bg-white hover:shadow-sm active:scale-95 transition-all disabled:opacity-40">
              <span className="material-symbols-outlined">arrow_back</span>
              Previous
            </button>
            <div className="flex items-center gap-3">
              {current && (
                <button onClick={() => toggleReview(current.id)}
                  className={`p-3 rounded-xl transition-colors ${
                    reviewed.has(current.id)
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`} title="Bookmark Question">
                  <span className="material-symbols-outlined"
                    style={{ fontVariationSettings: reviewed.has(current.id) ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                </button>
              )}
              <button onClick={next}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all">
                {currentIdx === total - 1 ? 'Submit Quiz' : 'Save & Next'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
