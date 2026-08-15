'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { dataService } from '@/lib/supabaseClient';
import { fadeUp } from '@/lib/motion';
import { PageSkeleton } from '@/components/motion/Skeleton';

const ALPHA = ['A', 'B', 'C', 'D'];

function makeQuestion(moduleId: string, order: number) {
  const qId = `q-${moduleId}-${Date.now()}-${order}`;
  return {
    id: qId,
    question_text: '',
    answers: ALPHA.map((_, i) => ({
      id: `a-${qId}-${i + 1}`,
      answer_text: '',
      is_correct: i === 0,
    })),
  };
}

export default function AdminQuizEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id: moduleId } = React.use(params);

  const [moduleTitle, setModuleTitle] = useState('');
  const [isNewQuiz, setIsNewQuiz] = useState(true);

  const [quizTitle, setQuizTitle] = useState('');
  const [passPercentage, setPassPercentage] = useState(80);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(300);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const item = await dataService.getModule(moduleId);
        if (!item) return;
        setModuleTitle(item.title || '');

        if (item.quiz?.id) {
          setIsNewQuiz(false);
          setQuizTitle(item.quiz.title || '');
          setPassPercentage(item.quiz.pass_percentage || 80);
          setTimeLimitSeconds(item.quiz.time_limit_seconds || 300);
          setShuffleQuestions(item.quiz.shuffle_questions || false);
          setIsPublished(item.quiz.is_published ?? true);
          const qs = (item.quiz.questions || []).map((q: any) => ({
            ...q,
            answers: (q.answers || []).map((a: any) => ({ ...a, answer_text: a.answer_text ?? a.text ?? '' })),
          }));
          setQuestions(qs.length > 0 ? qs : [makeQuestion(moduleId, 0)]);
        } else {
          setQuizTitle(`${item.title} Quiz`);
          setQuestions([makeQuestion(moduleId, 0)]);
        }
      } catch (e) {
        console.error('Error loading module:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [moduleId]);

  const addQuestion = () => setQuestions(prev => [...prev, makeQuestion(moduleId, prev.length)]);
  const removeQuestion = (idx: number) => setQuestions(prev => prev.filter((_, i) => i !== idx));
  const setQuestionText = (idx: number, text: string) =>
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question_text: text } : q));
  const setAnswerText = (qIdx: number, aIdx: number, text: string) =>
    setQuestions(prev => prev.map((q, i) => i !== qIdx ? q : {
      ...q, answers: q.answers.map((a: any, j: number) => j === aIdx ? { ...a, answer_text: text } : a),
    }));
  const setCorrectAnswer = (qIdx: number, aIdx: number) =>
    setQuestions(prev => prev.map((q, i) => i !== qIdx ? q : {
      ...q, answers: q.answers.map((a: any, j: number) => ({ ...a, is_correct: j === aIdx })),
    }));

  const handleSave = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!questions.some(q => q.question_text.trim())) {
      setErrorMsg('Add at least one question before saving.');
      return;
    }
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await dataService.saveQuiz(moduleId, quizTitle || `${moduleTitle} Quiz`, passPercentage, questions, {
        timeLimitSeconds, shuffleQuestions, isPublished,
      });
      setIsNewQuiz(false);
      setSuccessMsg('Quiz saved successfully!');
      setTimeout(() => { window.location.href = '/admin/quizzes'; }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSkeleton shape="rows" count={4} />;
  }

  return (
    <div className="bg-white text-neutral-900 min-h-screen pb-10">
      <header className="sticky top-0 w-full z-50 bg-white border-b border-neutral-100 shadow-sm">
        <div className="flex justify-between items-center px-6 h-16 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/admin/quizzes" className="material-symbols-outlined text-orange-500 active:scale-95 p-2 hover:bg-neutral-50 rounded-full flex items-center justify-center shrink-0">
              arrow_back
            </Link>
            <div className="min-w-0">
              <span className="text-lg font-headline font-black text-orange-500 block leading-tight">
                {isNewQuiz ? 'Create Quiz' : 'Edit Quiz'}
              </span>
              <span className="text-xs text-neutral-400 truncate block">{moduleTitle}</span>
            </div>
          </div>
          {!isNewQuiz && (
            <button type="button" onClick={() => setIsPublished(v => !v)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all shrink-0 ${
                isPublished ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-neutral-400 bg-neutral-50 hover:bg-neutral-100'
              }`}>
              {isPublished ? 'Published' : 'Draft'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-8">
        <motion.form onSubmit={handleSave} className="space-y-6" initial="hidden" animate="visible" variants={fadeUp}>
          {successMsg && (
            <div className="p-4 text-sm text-green-600 bg-green-50 rounded-2xl border border-green-100 font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>{successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100 font-bold">{errorMsg}</div>
          )}

          <section className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 flex flex-col">
                <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Quiz Title</label>
                <input type="text" value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
              </div>
              <div className="flex flex-col">
                <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Pass % (default 80)</label>
                <input type="number" min={1} max={100} value={passPercentage}
                  onChange={e => setPassPercentage(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Time Limit (seconds)</label>
                <input type="number" min={30} step={30} value={timeLimitSeconds}
                  onChange={e => setTimeLimitSeconds(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
              </div>
              <div className="sm:col-span-2 flex flex-col justify-end">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl cursor-pointer w-fit">
                  <input type="checkbox" checked={shuffleQuestions}
                    onChange={e => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded" />
                  <span className="text-sm font-semibold text-neutral-600">Shuffle question order for students</span>
                </label>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            {questions.map((q, qIdx) => (
              <div key={q.id} className="p-5 border border-slate-100 bg-slate-50/30 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="bg-orange-500/10 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                    Question {(qIdx + 1).toString().padStart(2, '0')}
                  </span>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qIdx)}
                      className="text-neutral-300 hover:text-red-500 transition-colors p-1">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  )}
                </div>

                <input type="text" value={q.question_text}
                  onChange={e => setQuestionText(qIdx, e.target.value)}
                  placeholder="Enter question text..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm font-semibold transition-all" />

                <div className="space-y-2">
                  <label className="font-label font-semibold text-xs text-neutral-400">Answer Options — click ✓ to mark correct</label>
                  {q.answers.map((a: any, aIdx: number) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-neutral-100 font-black text-xs flex items-center justify-center text-neutral-500 shrink-0">
                        {ALPHA[aIdx]}
                      </span>
                      <input type="text" value={a.answer_text}
                        onChange={e => setAnswerText(qIdx, aIdx, e.target.value)}
                        placeholder={`Option ${ALPHA[aIdx]}`}
                        className="flex-grow px-4 py-2 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-xs transition-all" />
                      <button type="button" onClick={() => setCorrectAnswer(qIdx, aIdx)}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                          a.is_correct ? 'text-emerald-500 bg-emerald-50 border-emerald-200' : 'text-neutral-300 border-neutral-100 hover:border-emerald-200 hover:text-emerald-400'
                        }`}>
                        <span className="material-symbols-outlined text-sm">
                          {a.is_correct ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button type="button" onClick={addQuestion}
              className="w-full py-2.5 border-2 border-dashed border-orange-300 hover:border-orange-500 text-orange-500 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span>
              Add Question
            </button>
          </section>

          <div className="flex gap-4 pb-6">
            <Link href="/admin/quizzes"
              className="w-1/3 bg-neutral-100 text-neutral-700 text-center font-bold py-4 rounded-xl hover:bg-neutral-200 transition-all">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="w-2/3 bg-orange-500 hover:bg-orange-600 text-white font-headline font-bold py-4 rounded-xl shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : isNewQuiz ? 'Create Quiz' : 'Save Quiz'}
            </button>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
