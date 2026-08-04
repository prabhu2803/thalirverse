'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dataService, supabase } from '@/lib/supabaseClient';
import AdminSidebar from '../AdminSidebar';

const ALPHA = ['A', 'B', 'C', 'D'];
const STEPS = ['Module Details', 'Video Lessons', 'Quiz'];

function makeQuestion(tmpId: string, order: number) {
  const qId = `new-q-${tmpId}-${order}`;
  return {
    id: qId,
    question_text: '',
    answers: ALPHA.map((_, i) => ({
      id: `new-a-${qId}-${i}`,
      answer_text: '',
      is_correct: i === 0,
    })),
  };
}

export default function AdminModules() {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Multi-step create flow ───────────────────────────────────
  const [step, setStep] = useState(0); // 0 = hidden, 1‑3 = active steps

  // Step 1 — details
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Step 2 — lessons
  const [skipLessons, setSkipLessons] = useState(false);
  const [newLessons, setNewLessons] = useState<{ title: string; url: string }[]>([]);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonUrl, setLessonUrl] = useState('');

  // Step 3 — quiz
  const [includeQuiz, setIncludeQuiz] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [passPercent, setPassPercent] = useState(80);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(300);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [questions, setQuestions] = useState<any[]>([makeQuestion('init', 0)]);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // ── Delete confirm ───────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [totalStudents,  setTotalStudents]  = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [avgScore,       setAvgScore]       = useState(0);
  const [adminRole, setAdminRole] = useState('SUPER_ADMIN');
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    dataService.getActiveStudent().then(a => {
      if (!a || !['SUPER_ADMIN', 'YI_ADMIN'].includes(a.role)) { router.push('/login'); return; }
      setAdminRole(a.role);
      setAdminName(a.fullName || 'Admin');
    });
    loadModules();
  }, []);

  async function loadModules() {
    try {
      const mods = await dataService.getModules();
      setModules(mods);

      // Stats
      const [{ count: studentCount }, { data: attempts }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT'),
        supabase.from('quiz_attempts').select('score, passed'),
      ]);
      setTotalStudents(studentCount ?? 0);
      const passedAttempts = attempts?.filter(a => a.passed) ?? [];
      setAvgScore(passedAttempts.length ? Math.round(passedAttempts.reduce((s, a) => s + a.score, 0) / passedAttempts.length) : 0);

      if ((studentCount ?? 0) > 0 && mods.length > 0) {
        const { data: prog } = await supabase.from('progress').select('student_id, module_id, status');
        const totalLessons = mods.reduce((s: number, m: any) => s + (m.lessons?.length ?? 0), 0);
        const totalPossible = (studentCount ?? 0) * totalLessons;
        const done = (prog ?? []).filter((p: any) => p.status === 'COMPLETED').length;
        setCompletionRate(totalPossible > 0 ? Math.round((done / totalPossible) * 100) : 0);
      }
    } catch (e) {
      console.error('Error loading modules:', e);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setStep(1);
    setNewTitle(''); setNewCategory(''); setNewDescription('');
    setSkipLessons(false); setNewLessons([]); setLessonTitle(''); setLessonUrl('');
    setIncludeQuiz(false); setQuizTitle(''); setPassPercent(80);
    setTimeLimitSeconds(300); setShuffleQuestions(false);
    setQuestions([makeQuestion(String(Date.now()), 0)]);
    setCreateError('');
  }

  function closeCreate() { setStep(0); setCreateError(''); }

  // Step navigation
  function handleNext() {
    setCreateError('');
    if (step === 1) {
      if (!newTitle.trim() || !newCategory.trim()) { setCreateError('Title and category are required.'); return; }
      setQuizTitle(`${newTitle.trim()} Quiz`);
    }
    if (step === 2 && lessonTitle.trim() && lessonUrl.trim()) {
      setNewLessons(prev => [...prev, { title: lessonTitle.trim(), url: lessonUrl.trim() }]);
      setLessonTitle(''); setLessonUrl('');
    }
    setStep(s => s + 1);
  }

  function handleBack() { setCreateError(''); setStep(s => s - 1); }

  async function handleFinish() {
    // Flush any pending lesson form
    const finalLessons = [...newLessons];
    if (!skipLessons && lessonTitle.trim() && lessonUrl.trim()) {
      finalLessons.push({ title: lessonTitle.trim(), url: lessonUrl.trim() });
    }

    setCreating(true);
    setCreateError('');
    try {
      const created = await dataService.createModule(newTitle.trim(), newCategory.trim(), newDescription.trim());

      for (let i = 0; i < finalLessons.length; i++) {
        await dataService.addLesson(created.id, finalLessons[i].title, finalLessons[i].url, i);
      }

      if (includeQuiz && questions.some(q => q.question_text.trim())) {
        await dataService.saveQuiz(created.id, quizTitle || `${newTitle} Quiz`, passPercent, questions, {
          timeLimitSeconds, shuffleQuestions,
        });
      }

      window.location.href = '/admin/modules';
    } catch (err: any) {
      setCreateError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  // Quiz helpers
  const addQuestion = () =>
    setQuestions(prev => [...prev, makeQuestion(String(Date.now()), prev.length)]);

  const removeQuestion = (i: number) =>
    setQuestions(prev => prev.filter((_, idx) => idx !== i));

  const setQText = (i: number, v: string) =>
    setQuestions(prev => prev.map((q, idx) => idx !== i ? q : { ...q, question_text: v }));

  const setAText = (qi: number, ai: number, v: string) =>
    setQuestions(prev => prev.map((q, i) => i !== qi ? q : {
      ...q, answers: q.answers.map((a: any, j: number) => j !== ai ? a : { ...a, answer_text: v }),
    }));

  const setCorrect = (qi: number, ai: number) =>
    setQuestions(prev => prev.map((q, i) => i !== qi ? q : {
      ...q, answers: q.answers.map((a: any, j: number) => ({ ...a, is_correct: j === ai })),
    }));

  // Module list helpers
  const handleTogglePublish = async (id: string, current: boolean) => {
    await dataService.updateModule(id, { is_published: !current });
    setModules(prev => prev.map(m => m.id === id ? { ...m, is_published: !current } : m));
  };

  const handleDeleteModule = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dataService.deleteModule(deleteTarget.id);
      setModules(prev => prev.filter(m => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
        <span className="animate-spin text-4xl">⏳</span>
        <span>Loading modules...</span>
      </div>
    </div>
  );

  return (
    <div className="flex overflow-hidden h-screen bg-neutral-50 font-body text-neutral-900">
      <AdminSidebar role={adminRole} adminName={adminName} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100 h-16 flex items-center px-8 shadow-sm">
          <h2 className="text-base font-headline font-bold text-neutral-700">Course Builder</h2>
        </header>

      <main className="px-8 pt-8 pb-10 space-y-8 max-w-5xl">
        {/* Page title + Create button */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black font-headline tracking-tight">Course Builder & Content Manager</h1>
            <p className="text-neutral-500 text-sm">Create, publish, and manage video syllabi across Young Indians tracks.</p>
          </div>
          <button onClick={openCreate}
            className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-sm hover:-translate-y-0.5 active:translate-y-0 transition-all">
            <span className="material-symbols-outlined text-sm">add</span>
            Create New Module
          </button>
        </section>

        {/* Stats row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Courses',   value: modules.length,    icon: 'menu_book',        color: 'text-orange-500' },
            { label: 'Active Students', value: totalStudents,     icon: 'group',            color: 'text-blue-500' },
            { label: 'Completion Rate', value: `${completionRate}%`, icon: 'analytics',     color: 'text-green-500' },
            { label: 'Avg Quiz Score',  value: avgScore > 0 ? `${avgScore}%` : '—', icon: 'workspace_premium', color: 'text-purple-500' },
          ].map(card => (
            <div key={card.label} className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined text-xl ${card.color}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                <span className="text-[10px] font-label font-bold text-neutral-400 uppercase tracking-widest">{card.label}</span>
              </div>
              <p className="text-3xl font-headline font-black text-neutral-900">{card.value}</p>
            </div>
          ))}
        </section>

        {/* Modules list */}
        <section className="space-y-6">
          {modules.length === 0 && (
            <div className="text-center py-20 text-neutral-400">
              <span className="material-symbols-outlined text-5xl mb-3 block">library_books</span>
              <p className="font-bold">No modules yet. Create your first one above.</p>
            </div>
          )}
          {modules.map((m) => (
            <div key={m.id} className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">menu_book</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-lg">{m.title}</h3>
                    <p className="text-xs text-neutral-400 mt-1">{m.category} · {m.lessons?.length || 0} Lessons</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleTogglePublish(m.id, m.is_published)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                      m.is_published ? 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100' : 'text-neutral-400 bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                    }`}>
                    {m.is_published ? 'Published' : 'Draft'}
                  </button>
                  <Link href={`/admin/edit-module/${m.id}`}
                    className="p-2 border border-slate-100 hover:border-orange-500 hover:text-orange-500 rounded-xl transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </Link>
                  <button onClick={() => setDeleteTarget({ id: m.id, title: m.title })}
                    className="p-2 border border-slate-100 hover:border-red-400 hover:text-red-500 text-neutral-400 rounded-xl transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
              {m.lessons?.length > 0 && (
                <div className="border-t border-neutral-100 pt-4 space-y-2">
                  <span className="text-[10px] font-label font-bold text-neutral-400 uppercase tracking-widest block mb-2">Active Videos</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {m.lessons.map((lesson: any, idx: number) => (
                      <div key={lesson.id} className="flex justify-between items-center p-3 border border-slate-50 rounded-2xl bg-slate-50/50">
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="font-mono text-xs text-neutral-400">{(idx + 1).toString().padStart(2, '0')}</span>
                          <span className="text-xs font-bold text-neutral-700 truncate">{lesson.title}</span>
                        </div>
                        <a href={lesson.content_url} target="_blank" rel="noreferrer"
                          className="material-symbols-outlined text-neutral-400 hover:text-orange-500 text-lg ml-2">link</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      </main>

      {/* ════════════ MULTI-STEP CREATE OVERLAY ════════════ */}
      {step > 0 && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] animate-[slide-up_0.25s_ease-out]">

            {/* Top bar: step indicator + close */}
            <div className="px-8 pt-7 pb-4 border-b border-neutral-100 shrink-0">
              <div className="flex justify-between items-center mb-5">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  Step {step} of {STEPS.length}
                </span>
                <button onClick={closeCreate} className="text-neutral-400 hover:text-neutral-600 p-1 rounded-full transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Progress dots */}
              <div className="flex items-center gap-2">
                {STEPS.map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 transition-all`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        i + 1 < step ? 'bg-green-500 text-white' : i + 1 === step ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-400'
                      }`}>
                        {i + 1 < step
                          ? <span className="material-symbols-outlined text-sm">check</span>
                          : i + 1}
                      </div>
                      <span className={`text-xs font-bold hidden sm:block ${i + 1 === step ? 'text-orange-500' : 'text-neutral-400'}`}>
                        {label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 w-6 rounded-full ${i + 1 < step ? 'bg-green-400' : 'bg-neutral-100'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="overflow-y-auto flex-1 px-8 py-6 space-y-5">

              {createError && (
                <div className="p-3 text-xs text-red-600 bg-red-50 rounded-xl border border-red-100 font-bold">{createError}</div>
              )}

              {/* ── Step 1: Module Details ── */}
              {step === 1 && (
                <>
                  <div>
                    <h2 className="text-xl font-headline font-black text-neutral-900">Module Details</h2>
                    <p className="text-sm text-neutral-400 mt-1">Give your module a name and category.</p>
                  </div>
                  <div className="flex flex-col">
                    <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Module Title *</label>
                    <input autoFocus type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g. Road Safety"
                      className="w-full px-4 py-3 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Category *</label>
                    <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)}
                      placeholder="e.g. Safety"
                      className="w-full px-4 py-3 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Description</label>
                    <textarea rows={3} value={newDescription} onChange={e => setNewDescription(e.target.value)}
                      placeholder="What will students learn in this module?"
                      className="w-full px-4 py-3 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm resize-none transition-all" />
                  </div>
                </>
              )}

              {/* ── Step 2: Video Lessons ── */}
              {step === 2 && (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-headline font-black text-neutral-900">Video Lessons</h2>
                      <p className="text-sm text-neutral-400 mt-1">Add YouTube videos or skip if quiz-only.</p>
                    </div>
                    <button type="button" onClick={() => setSkipLessons(s => !s)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${skipLessons ? 'bg-neutral-100 text-neutral-500' : 'bg-orange-50 text-orange-600'}`}>
                      {skipLessons ? '+ Add Videos' : 'Skip Videos'}
                    </button>
                  </div>

                  {skipLessons ? (
                    <div className="flex flex-col items-center py-6 text-center text-neutral-400 gap-2">
                      <span className="material-symbols-outlined text-4xl">play_circle</span>
                      <p className="text-sm font-medium">No videos — module will launch directly to the quiz.</p>
                    </div>
                  ) : (
                    <>
                      {newLessons.map((l, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                          <span className="font-mono text-xs text-neutral-400 shrink-0">{(i + 1).toString().padStart(2, '0')}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-neutral-700 truncate">{l.title}</p>
                            <p className="text-xs text-neutral-400 truncate">{l.url}</p>
                          </div>
                          <button type="button" onClick={() => setNewLessons(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-neutral-300 hover:text-red-400 transition-colors shrink-0">
                            <span className="material-symbols-outlined text-lg">close</span>
                          </button>
                        </div>
                      ))}
                      <div className="space-y-3 border-t border-neutral-100 pt-4">
                        <input type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)}
                          placeholder="Lesson title"
                          className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                        <input type="url" value={lessonUrl} onChange={e => setLessonUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                        <button type="button"
                          disabled={!lessonTitle.trim() || !lessonUrl.trim()}
                          onClick={() => {
                            if (!lessonTitle.trim() || !lessonUrl.trim()) return;
                            setNewLessons(prev => [...prev, { title: lessonTitle.trim(), url: lessonUrl.trim() }]);
                            setLessonTitle(''); setLessonUrl('');
                          }}
                          className="w-full py-2.5 border-2 border-dashed border-orange-300 hover:border-orange-500 text-orange-500 font-bold text-sm rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-sm">add</span>
                          Add Lesson
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── Step 3: Quiz ── */}
              {step === 3 && (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-headline font-black text-neutral-900">Quiz</h2>
                      <p className="text-sm text-neutral-400 mt-1">Add an assessment or skip for video-only modules.</p>
                    </div>
                    <button type="button" onClick={() => setIncludeQuiz(q => !q)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${!includeQuiz ? 'bg-neutral-100 text-neutral-500' : 'bg-orange-50 text-orange-600'}`}>
                      {includeQuiz ? 'Skip Quiz' : '+ Add Quiz'}
                    </button>
                  </div>

                  {!includeQuiz ? (
                    <div className="flex flex-col items-center py-6 text-center text-neutral-400 gap-2">
                      <span className="material-symbols-outlined text-4xl">quiz</span>
                      <p className="text-sm font-medium">No quiz — students earn badges on lesson completion.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 flex flex-col">
                          <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Quiz Title</label>
                          <input type="text" value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                        </div>
                        <div className="flex flex-col">
                          <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Pass %</label>
                          <input type="number" min={1} max={100} value={passPercent}
                            onChange={e => setPassPercent(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Time Limit (seconds)</label>
                          <input type="number" min={30} step={30} value={timeLimitSeconds}
                            onChange={e => setTimeLimitSeconds(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                        </div>
                        <div className="flex flex-col justify-end">
                          <label className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl cursor-pointer">
                            <input type="checkbox" checked={shuffleQuestions}
                              onChange={e => setShuffleQuestions(e.target.checked)}
                              className="w-4 h-4 accent-orange-500 rounded" />
                            <span className="text-sm font-semibold text-neutral-600">Shuffle question order</span>
                          </label>
                        </div>
                      </div>

                      {questions.map((q, qi) => (
                        <div key={q.id} className="p-4 border border-slate-100 bg-slate-50/30 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                              Q{(qi + 1).toString().padStart(2, '0')}
                            </span>
                            {questions.length > 1 && (
                              <button type="button" onClick={() => removeQuestion(qi)}
                                className="text-neutral-300 hover:text-red-400 transition-colors">
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            )}
                          </div>
                          <input type="text" value={q.question_text} onChange={e => setQText(qi, e.target.value)}
                            placeholder="Enter question..."
                            className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm font-semibold transition-all" />
                          <div className="space-y-2">
                            {q.answers.map((a: any, ai: number) => (
                              <div key={a.id} className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-neutral-100 text-xs font-black flex items-center justify-center text-neutral-500 shrink-0">{ALPHA[ai]}</span>
                                <input type="text" value={a.answer_text} onChange={e => setAText(qi, ai, e.target.value)}
                                  placeholder={`Option ${ALPHA[ai]}`}
                                  className="flex-grow px-3 py-2 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-xs transition-all" />
                                <button type="button" onClick={() => setCorrect(qi, ai)}
                                  className={`p-1.5 rounded-xl border transition-all shrink-0 ${a.is_correct ? 'text-emerald-500 bg-emerald-50 border-emerald-200' : 'text-neutral-300 border-neutral-100 hover:border-emerald-200 hover:text-emerald-400'}`}>
                                  <span className="material-symbols-outlined text-sm">{a.is_correct ? 'check_circle' : 'radio_button_unchecked'}</span>
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
                    </>
                  )}
                </>
              )}
            </div>

            {/* Bottom navigation */}
            <div className="px-8 py-5 border-t border-neutral-100 flex justify-between items-center shrink-0">
              <button type="button" onClick={step === 1 ? closeCreate : handleBack}
                className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition-all">
                {step === 1 ? 'Cancel' : '← Back'}
              </button>
              {step < 3 ? (
                <button type="button" onClick={handleNext}
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all shadow-md">
                  Next →
                </button>
              ) : (
                <button type="button" onClick={handleFinish} disabled={creating}
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50">
                  {creating ? 'Creating...' : '✓ Create Module'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-[fade-in_0.2s_ease-out]">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
              </div>
              <div>
                <h3 className="font-headline font-black text-lg">Delete Module?</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  <span className="font-bold text-neutral-700">"{deleteTarget.title}"</span> and all its lessons will be permanently removed.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => setDeleteTarget(null)}
                  className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition-all">
                  Cancel
                </button>
                <button onClick={handleDeleteModule} disabled={deleting}
                  className="w-1/2 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in   { from { opacity: 0; transform: scale(0.95);      } to { opacity: 1; transform: scale(1);      } }
      `}</style>
      </div>
    </div>
  );
}
