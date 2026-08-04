'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { dataService } from '@/lib/supabaseClient';

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

export default function AdminEditModule({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  // Module details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  // Lessons
  const [lessons, setLessons] = useState<any[]>([]);
  const [skipLessons, setSkipLessons] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);
  const [addLessonError, setAddLessonError] = useState('');

  // Quiz
  const [includeQuiz, setIncludeQuiz] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [passPercentage, setPassPercentage] = useState(80);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(300);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const item = await dataService.getModule(id);
        if (!item) return;
        setTitle(item.title || '');
        setDescription(item.description || '');
        setCategory(item.category || '');
        setLessons(item.lessons || []);
        setSkipLessons((item.lessons || []).length === 0);

        if (item.quiz?.id) {
          setIncludeQuiz(true);
          setQuizTitle(item.quiz.title || '');
          setPassPercentage(item.quiz.pass_percentage || 80);
          setTimeLimitSeconds(item.quiz.time_limit_seconds || 300);
          setShuffleQuestions(item.quiz.shuffle_questions || false);
          const qs = (item.quiz.questions || []).map((q: any) => ({
            ...q,
            answers: (q.answers || []).map((a: any) => ({
              ...a,
              answer_text: a.answer_text ?? a.text ?? '',
            })),
          }));
          setQuestions(qs.length > 0 ? qs : [makeQuestion(id, 0)]);
        } else {
          setQuizTitle(`${item.title} Quiz`);
          setTimeLimitSeconds(300);
          setShuffleQuestions(false);
          setQuestions([makeQuestion(id, 0)]);
        }
      } catch (e) {
        console.error('Error loading module:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Lesson helpers ────────────────────────────────────────────
  const handleLessonChange = (lessonId: string, field: string, value: string) =>
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, [field]: value } : l));

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim() || !newLessonUrl.trim()) return;
    setAddingLesson(true);
    setAddLessonError('');
    try {
      const added = await dataService.addLesson(id, newLessonTitle.trim(), newLessonUrl.trim(), lessons.length);
      setLessons(prev => [...prev, added]);
      setNewLessonTitle('');
      setNewLessonUrl('');
    } catch (err: any) {
      setAddLessonError(err?.message || 'Failed to add lesson.');
    } finally {
      setAddingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    await dataService.deleteLesson(lessonId);
    setLessons(prev => prev.filter(l => l.id !== lessonId));
  };

  // ── Quiz helpers ──────────────────────────────────────────────
  const addQuestion = () =>
    setQuestions(prev => [...prev, makeQuestion(id, prev.length)]);

  const removeQuestion = (idx: number) =>
    setQuestions(prev => prev.filter((_, i) => i !== idx));

  const setQuestionText = (idx: number, text: string) =>
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question_text: text } : q));

  const setAnswerText = (qIdx: number, aIdx: number, text: string) =>
    setQuestions(prev => prev.map((q, i) => i !== qIdx ? q : {
      ...q,
      answers: q.answers.map((a: any, j: number) => j === aIdx ? { ...a, answer_text: text } : a),
    }));

  const setCorrectAnswer = (qIdx: number, aIdx: number) =>
    setQuestions(prev => prev.map((q, i) => i !== qIdx ? q : {
      ...q,
      answers: q.answers.map((a: any, j: number) => ({ ...a, is_correct: j === aIdx })),
    }));

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      let currentLessons = lessons;

      // Flush pending lesson form
      if (!skipLessons && newLessonTitle.trim() && newLessonUrl.trim()) {
        const added = await dataService.addLesson(id, newLessonTitle.trim(), newLessonUrl.trim(), currentLessons.length);
        currentLessons = [...currentLessons, added];
        setLessons(currentLessons);
        setNewLessonTitle('');
        setNewLessonUrl('');
      }

      await dataService.updateModule(id, { title, description, category });
      await Promise.all(
        currentLessons.map(l => dataService.updateLesson(l.id, { title: l.title, content_url: l.content_url }))
      );

      if (includeQuiz && questions.some(q => q.question_text.trim())) {
        await dataService.saveQuiz(id, quizTitle || `${title} Quiz`, passPercentage, questions, {
          timeLimitSeconds, shuffleQuestions,
        });
      }

      setSuccessMsg('Module saved successfully!');
      setTimeout(() => { window.location.href = '/admin/modules'; }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
          <span className="animate-spin text-4xl">⏳</span>
          <span>Loading module...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-neutral-900 min-h-screen pb-10">
      <header className="sticky top-0 w-full z-50 bg-white border-b border-neutral-100 shadow-sm">
        <div className="flex justify-between items-center px-6 h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/admin/modules" className="material-symbols-outlined text-orange-500 active:scale-95 p-2 hover:bg-neutral-50 rounded-full flex items-center justify-center">
              arrow_back
            </Link>
            <span className="text-xl font-headline font-black text-orange-500">Edit Module</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-8">
        <form onSubmit={handleSave} className="space-y-6">

          {successMsg && (
            <div className="p-4 text-sm text-green-600 bg-green-50 rounded-2xl border border-green-100 font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>{successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100 font-bold">{errorMsg}</div>
          )}

          {/* ── SECTION 1: Module Details ── */}
          <section className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <div className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center">1</div>
              <h3 className="font-headline font-bold text-base">Module Details</h3>
            </div>
            <div className="flex flex-col">
              <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Module Title *</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
            </div>
            <div className="flex flex-col">
              <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Category *</label>
              <input type="text" required value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
            </div>
            <div className="flex flex-col">
              <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Description</label>
              <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm resize-none transition-all" />
            </div>
          </section>

          {/* ── SECTION 2: Video Lessons ── */}
          <section className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center ${skipLessons ? 'bg-neutral-300' : 'bg-orange-500'}`}>2</div>
                <h3 className="font-headline font-bold text-base">Video Lessons</h3>
              </div>
              <button type="button" onClick={() => setSkipLessons(s => !s)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${skipLessons ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                {skipLessons ? '+ Add Videos' : 'Skip Videos'}
              </button>
            </div>

            {!skipLessons && (
              <div className="p-6 space-y-5">
                {lessons.length === 0 && (
                  <p className="text-sm text-neutral-400 text-center py-4">No lessons yet. Add one below.</p>
                )}
                {lessons.map((lesson, idx) => (
                  <div key={lesson.id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-orange-500/10 text-orange-600 text-xs font-bold font-mono px-2.5 py-1 rounded-full">
                        Lesson {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <button type="button" onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-neutral-300 hover:text-red-500 transition-colors p-1">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                    <input type="text" value={lesson.title} onChange={e => handleLessonChange(lesson.id, 'title', e.target.value)}
                      placeholder="Lesson title"
                      className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                    <input type="url" value={lesson.content_url} onChange={e => handleLessonChange(lesson.id, 'content_url', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                  </div>
                ))}

                {/* Add lesson */}
                <div className="border-t border-neutral-100 pt-4 space-y-3">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Add New Lesson</p>
                  <input type="text" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)}
                    placeholder="Lesson title"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                  <input type="url" value={newLessonUrl} onChange={e => setNewLessonUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                  {addLessonError && (
                    <div className="p-3 text-xs text-red-600 bg-red-50 rounded-xl border border-red-100 font-bold">{addLessonError}</div>
                  )}
                  <button type="button" onClick={handleAddLesson}
                    disabled={addingLesson || !newLessonTitle.trim() || !newLessonUrl.trim()}
                    className="w-full py-2.5 border-2 border-dashed border-orange-300 hover:border-orange-500 text-orange-500 font-bold text-sm rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">add</span>
                    {addingLesson ? 'Adding...' : 'Add Lesson'}
                  </button>
                </div>
              </div>
            )}
            {skipLessons && (
              <p className="px-6 py-4 text-sm text-neutral-400">Videos skipped — this module will launch directly to the quiz.</p>
            )}
          </section>

          {/* ── SECTION 3: Quiz ── */}
          <section className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center ${!includeQuiz ? 'bg-neutral-300' : 'bg-orange-500'}`}>3</div>
                <h3 className="font-headline font-bold text-base">Quiz</h3>
              </div>
              <button type="button" onClick={() => setIncludeQuiz(q => !q)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${!includeQuiz ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                {includeQuiz ? 'Skip Quiz' : '+ Add Quiz'}
              </button>
            </div>

            {includeQuiz && (
              <div className="p-6 space-y-6">
                {/* Quiz meta */}
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

                {/* Questions */}
                <div className="space-y-5">
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
                </div>

                <button type="button" onClick={addQuestion}
                  className="w-full py-2.5 border-2 border-dashed border-orange-300 hover:border-orange-500 text-orange-500 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Question
                </button>
              </div>
            )}
            {!includeQuiz && (
              <p className="px-6 py-4 text-sm text-neutral-400">Quiz skipped — students will receive a badge on lesson completion only.</p>
            )}
          </section>

          {/* ── Actions ── */}
          <div className="flex gap-4 pb-6">
            <Link href="/admin/modules"
              className="w-1/3 bg-neutral-100 text-neutral-700 text-center font-bold py-4 rounded-xl hover:bg-neutral-200 transition-all">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="w-2/3 bg-orange-500 hover:bg-orange-600 text-white font-headline font-bold py-4 rounded-xl shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : 'Save Module'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
