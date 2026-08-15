'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, animate } from 'framer-motion';
import confetti from 'canvas-confetti';
import { dataService, supabase } from '@/lib/supabaseClient';
import { fadeUp, popIn, staggerContainer, springSoft } from '@/lib/motion';
import { SkeletonBlock } from '@/components/motion/Skeleton';

function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: ['#f97316', '#fb923c', '#fbbf24', '#22c55e'],
    disableForReducedMotion: true,
  });
}

const SIDEBAR_LINKS = [
  { label: 'Dashboard',   href: '/dashboard', icon: 'home' },
  { label: 'My Courses',  href: '/dashboard', icon: 'auto_stories' },
  { label: 'Assessments', href: '/dashboard', icon: 'quiz',        active: true },
  { label: 'Resources',   href: '#',          icon: 'library_books' },
  { label: 'Community',   href: '#',          icon: 'forum' },
];

export default function QuizResults({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const [student,  setStudent]  = useState<any>(null);
  const [course,   setCourse]   = useState<any>(null);
  const [result,   setResult]   = useState<any>(null);
  const [showAll,  setShowAll]  = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const confettiFiredRef = useRef(false);

  // Fires exactly once, only when XP is actually (freshly) awarded this
  // session — never on a refresh/revisit, never on a fail.
  useEffect(() => {
    if (xpAwarded && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      fireConfetti();
    }
  }, [xpAwarded]);

  // Count the score ring's percentage up from 0 instead of snapping to it.
  useEffect(() => {
    if (!result) return;
    const controls = animate(0, result.score, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: latest => setDisplayScore(Math.round(latest)),
    });
    return () => controls.stop();
  }, [result?.score]);

  useEffect(() => {
    (async () => {
      const [s, c] = await Promise.all([
        dataService.getActiveStudent(),
        dataService.getModule(id),
      ]);
      setStudent(s);
      setCourse(c);

      const stored = sessionStorage.getItem(`quiz_result_${id}`);
      if (stored) {
        const r = JSON.parse(stored);
        setResult(r);

        // Award XP if passed and not yet awarded this session
        if (r.passed && s?.id && !sessionStorage.getItem(`xp_awarded_${id}`)) {
          const xpEarned = Math.round((r.score / 100) * (r.total * 10) + 100);
          const { data: prof } = await supabase.from('profiles').select('xp').eq('id', s.id).single();
          const currentXP = (prof as any)?.xp ?? 0;
          await supabase.from('profiles').update({ xp: currentXP + xpEarned }).eq('id', s.id);
          sessionStorage.setItem(`xp_awarded_${id}`, '1');
          setXpAwarded(true);
        }
      } else {
        setResult({ score: 0, correct: 0, total: 0, passed: false, timeTaken: '00:00', breakdown: [] });
      }
    })();
  }, [id]);

  if (!course || !result) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="max-w-4xl mx-auto lg:ml-56 space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="flex-1 p-8 space-y-4">
              <SkeletonBlock className="h-5 w-32 rounded-full" />
              <SkeletonBlock className="h-8 w-2/3 rounded-full" />
              <SkeletonBlock className="h-4 w-full rounded-full" />
              <SkeletonBlock className="h-10 w-48 rounded-xl" />
            </div>
            <div className="flex items-center justify-center p-8 min-w-[200px]">
              <SkeletonBlock className="w-28 h-28 rounded-full" />
            </div>
          </div>
          <SkeletonBlock className="h-40 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const { score, correct, total, passed, timeTaken, breakdown = [] } = result;
  const xpEarned = passed ? Math.round((score / 100) * (total * 10) + 100) : 0;
  const visibleBreakdown = showAll ? breakdown : breakdown.slice(0, 3);

  return (
    <div className="min-h-screen bg-neutral-50 font-body text-neutral-900 flex">

      {/* ── Left sidebar ───────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-neutral-100 fixed left-0 top-0 h-full z-40">
        <div className="flex items-center gap-2 px-5 h-14 border-b border-neutral-100 shrink-0">
          <span className="material-symbols-outlined text-orange-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          <span className="font-headline font-black text-orange-500 tracking-tight">ThalirVerse</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {SIDEBAR_LINKS.map(link => (
            <Link key={link.label} href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-label font-semibold transition-all ${
                link.active
                  ? 'bg-orange-50 text-orange-600 font-bold'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
              }`}>
              <span className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: link.active ? "'FILL' 1" : "'FILL' 0" }}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Upgrade Pro card */}
        <div className="mx-3 mb-3 p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <p className="text-[10px] font-label font-black uppercase tracking-wider mb-1">ThalirVerse Pro</p>
          <p className="text-xs leading-tight mb-3 text-orange-100">Unlock advanced assessments and certificates.</p>
          <button className="w-full py-1.5 bg-white text-orange-600 text-xs font-black rounded-lg">Upgrade Pro</button>
        </div>

        <div className="px-3 pb-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-50 transition-all">
            <span className="material-symbols-outlined text-sm">help</span>Help Centre
          </Link>
          <button onClick={() => { dataService.signOut(); window.location.href = '/login'; }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <span className="material-symbols-outlined text-sm">logout</span>Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────── */}
      <main className="lg:ml-56 flex-1 p-6 overflow-y-auto">
        <motion.div className="max-w-4xl mx-auto space-y-6" initial="hidden" animate="visible" variants={staggerContainer}>

          {/* Hero row: left (status + CTA) + right (score circle) */}
          <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Left: hero text */}
              <div className="flex-1 p-8">
                <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 ${
                  passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {passed ? 'Quiz Completed!' : 'Quiz Finished'}
                </span>
                <h1 className="text-3xl font-headline font-black text-neutral-900 leading-tight mb-2">
                  {passed ? (
                    <>Outstanding performance,{' '}
                      <span className="text-orange-500">{student?.fullName?.split(' ')[0] ?? 'You'}!</span>
                    </>
                  ) : (
                    <>Keep Learning,{' '}
                      <span className="text-orange-500">{student?.fullName?.split(' ')[0] ?? 'You'}!</span>
                    </>
                  )}
                </h1>
                <p className="text-sm text-neutral-500 mb-6 max-w-sm">
                  {passed
                    ? `You've mastered ${course.title}. Keep this momentum going!`
                    : `Review your lessons for ${course.title} and try again to earn your badge.`}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/dashboard"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5">
                    Continue to Next Lesson
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </Link>
                  {breakdown.length > 0 && (
                    <button onClick={() => setShowAll(true)}
                      className="flex items-center justify-center gap-2 px-5 py-3 border border-neutral-200 hover:border-neutral-400 text-neutral-600 font-bold text-sm rounded-xl transition-all">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      Review Answers
                    </button>
                  )}
                </div>
              </div>

              {/* Right: score circle */}
              <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-50 to-orange-100 min-w-[200px]">
                <div className="relative w-28 h-28 mb-3">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="56" cy="56" r="46" fill="none" stroke="#fed7aa" strokeWidth="10" />
                    <motion.circle cx="56" cy="56" r="46" fill="none" stroke="#f97316" strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 46}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - score / 100) }}
                      transition={springSoft} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-orange-500 text-2xl mb-0.5"
                      style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                    <span className="text-2xl font-black text-neutral-900">{displayScore}%</span>
                  </div>
                </div>
                <p className="text-xs font-label font-bold text-neutral-500 uppercase tracking-wider">Score</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 border-t border-neutral-100">
              {[
                { icon: 'schedule', label: 'Time Saved', value: timeTaken },
                { icon: 'bolt',     label: 'XP Gained',  value: `+${xpEarned}`, color: 'text-orange-500' },
                { icon: 'check',    label: 'Accuracy',   value: `${correct} / ${total}`, color: 'text-green-600' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center py-5 px-4 border-r border-neutral-100 last:border-r-0">
                  <span className={`material-symbols-outlined text-xl mb-1 ${s.color ?? 'text-neutral-400'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  <p className={`text-lg font-headline font-black ${s.color ?? 'text-neutral-800'}`}>{s.value}</p>
                  <p className="text-[10px] font-label text-neutral-400 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Performance Breakdown */}
          {breakdown.length > 0 && (
            <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h3 className="font-headline font-bold text-base">Performance Breakdown</h3>
                <button onClick={() => setShowAll(!showAll)}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                  {showAll ? 'Show Less' : 'All Questions'}
                </button>
              </div>
              <div className="divide-y divide-neutral-100">
                {visibleBreakdown.map((item: any, i: number) => {
                  const correct = item.userAnswerId === item.correctAnswerId;
                  return (
                    <div key={i} className="flex items-start gap-4 px-6 py-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                      }`}>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {correct ? 'check' : 'close'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-label font-black uppercase tracking-wider text-neutral-400">
                            Question {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                            correct ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                          }`}>
                            {correct ? 'Correct' : 'Incorrect'}
                          </span>
                          <span className="text-[10px] font-black text-orange-500 ml-auto">+{correct ? 20 : 0} XP</span>
                        </div>
                        <p className="text-sm text-neutral-700 leading-snug line-clamp-2">{item.questionText}</p>
                      </div>
                    </div>
                  );
                })}
                {!showAll && breakdown.length > 3 && (
                  <button onClick={() => setShowAll(true)}
                    className="w-full py-3 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">
                    Show {breakdown.length - 3} more answers
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Bottom row: Badge + Share */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Badge — independent celebratory pop, not tied to the parent stagger */}
            {passed && (
              <motion.div initial="hidden" animate="visible" variants={popIn}
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white flex items-center gap-4 shadow-lg shadow-orange-500/20">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-label font-black uppercase tracking-wider text-orange-200 mb-0.5">New Badge Unlocked!</p>
                  <h4 className="font-headline font-bold text-sm truncate">{course.badge_title || `${course.title} Badge`}</h4>
                </div>
                <Link href="/profile" className="shrink-0">
                  <span className="material-symbols-outlined">chevron_right</span>
                </Link>
              </motion.div>
            )}
            {!passed && (
              <Link href={`/courses/${id}`}
                className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 flex items-center gap-4 hover:border-orange-300 transition-all group">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-orange-500">replay</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm text-neutral-800">Try Again</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Review lessons and retake the quiz.</p>
                </div>
              </Link>
            )}

            {/* Share */}
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6">
              <h4 className="font-headline font-bold text-sm text-neutral-800 mb-4">Share your success</h4>
              <div className="flex gap-3">
                {[
                  { icon: 'share',            label: 'Share',    cls: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
                  { icon: 'alternate_email',  label: 'Email',    cls: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' },
                  { icon: 'download',         label: 'Download', cls: 'bg-green-50 text-green-600 hover:bg-green-100' },
                ].map(btn => (
                  <button key={btn.label}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all ${btn.cls}`}>
                    <span className="material-symbols-outlined text-xl">{btn.icon}</span>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
