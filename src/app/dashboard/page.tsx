'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '@/lib/supabaseClient';
import { fadeUp, staggerContainer, springSoft, popIn } from '@/lib/motion';
import { PageSkeleton } from '@/components/motion/Skeleton';
import JourneyRoadmap from '@/components/dashboard/JourneyRoadmap';
import ClassProgressPanel from '@/components/dashboard/ClassProgressPanel';
import CelebrationRocket from '@/components/motion/CelebrationRocket';
import OnboardingModal from '@/components/dashboard/OnboardingModal';
import {
  computeStreak, getModuleProgress, getBadgeEarnedDate as getBadgeEarnedDateShared,
  moduleTheme, hasCompletedToday, isStreakBroken,
  getOverallCompletionPct, MILESTONE_TIERS, MILESTONE_LABELS, getNextMilestone,
} from '@/lib/gamification';

/* ─── helpers ─────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: 'My Learning',  href: '/dashboard',   icon: 'auto_stories' },
  { label: 'Explore',      href: '/explore',     icon: 'search' },
  { label: 'Achievements', href: '/profile',     icon: 'military_tech' },
  { label: 'Leaderboard',  href: '/leaderboard', icon: 'leaderboard' },
];

/* ─── component ───────────────────────────────────────────────────── */

export default function Dashboard() {
  const router   = useRouter();
  const pathname = usePathname();
  const [showLockedNotice, setShowLockedNotice] = useState(false);

  // Reads the query param client-side (no useSearchParams/Suspense needed —
  // this banner is a purely client-side courtesy, never part of SSR output).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShowLockedNotice(new URLSearchParams(window.location.search).has('locked'));
  }, []);
  const [showNotif,  setShowNotif]  = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [student, setStudent]   = useState<any>(null);
  const [modules, setModules]   = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [quizAttempts, setQuiz] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [streakBrokenModal, setStreakBrokenModal] = useState<number | null>(null);
  const [timeLeftLabel, setTimeLeftLabel] = useState('');
  const [celebratingMilestone, setCelebratingMilestone] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await dataService.getActiveStudent();
        if (!s) { router.push('/login'); return; }
        setStudent(s);
        const [mods, prog, attempts] = await Promise.all([
          dataService.getModules(),
          dataService.getProgress(s.id),
          dataService.getQuizAttempts(s.id),
        ]);
        setModules(mods);
        setProgress(prog);
        setQuiz(attempts);
      } catch { /* handled below */ }
      finally { setLoading(false); }
    })();
  }, []);

  const streak  = useMemo(() => computeStreak(progress), [progress]);
  const streakDanger = streak > 0 && !hasCompletedToday(progress);
  const xp      = student?.xp ?? 0;

  // Danger-pill countdown: hours/minutes left before the streak lapses at
  // midnight local time. Ticks once a minute — a full-second timer would be
  // needless churn for a display this coarse.
  useEffect(() => {
    if (!streakDanger) return;
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
      const msLeft = midnight.getTime() - now.getTime();
      const h = Math.floor(msLeft / 3600000);
      const m = Math.floor((msLeft % 3600000) / 60000);
      setTimeLeftLabel(h > 0 ? `${h}h ${m}m left` : `${m}m left`);
    };
    tick();
    const int = setInterval(tick, 60000);
    return () => clearInterval(int);
  }, [streakDanger]);

  // Streak-broken moment: shown once per break event via a localStorage flag
  // keyed to that break's own last-active date, so a *new* break always
  // surfaces fresh even if a past one was already dismissed.
  useEffect(() => {
    if (!student || loading) return;
    const { broken, lastDate, lostStreakSize } = isStreakBroken(progress);
    if (!broken || lostStreakSize === 0 || !lastDate) return;
    const key = `tv_streak_break_seen_${student.id}_${lastDate.toISOString().split('T')[0]}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setStreakBrokenModal(lostStreakSize);
  }, [student, loading, progress]);
  const initials = useMemo(() => {
    if (!student?.fullName) return '?';
    const parts = student.fullName.trim().split(' ');
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }, [student]);

  const moduleProgress = useMemo(
    () => modules.map(m => ({ ...m, prog: getModuleProgress(m, progress, quizAttempts) })),
    [modules, progress, quizAttempts]
  );

  const getBadgeEarnedDate = (m: any) => getBadgeEarnedDateShared(m, progress, quizAttempts);

  const completedCount = moduleProgress.filter(m => m.prog.percent === 100).length;
  const totalCount     = modules.length;
  const overallPercent = getOverallCompletionPct(modules, progress, quizAttempts);

  // Biggest celebration in the app — fires once per milestone tier crossed,
  // gated server-side by profiles.highest_milestone_celebrated so it can
  // never re-fire on a later visit (or from another device).
  useEffect(() => {
    if (!student || loading || totalCount === 0) return;
    const highest = student.highestMilestoneCelebrated ?? 0;
    const crossed = MILESTONE_TIERS.filter(t => overallPercent >= t && t > highest);
    if (crossed.length > 0) setCelebratingMilestone(Math.max(...crossed));
  }, [student, loading, overallPercent, totalCount]);

  const handleMilestoneCelebrationDone = () => {
    if (celebratingMilestone && student) {
      dataService.markMilestoneCelebrated(student.id, celebratingMilestone);
      setStudent((s: any) => ({ ...s, highestMilestoneCelebrated: celebratingMilestone }));
    }
    setCelebratingMilestone(null);
  };

  const nextMilestone = useMemo(() => getNextMilestone(modules, progress, quizAttempts), [modules, progress, quizAttempts]);

  const activeModule = moduleProgress.find(m => m.prog.percent > 0 && m.prog.percent < 100) ?? moduleProgress[0];

  const incomplete = moduleProgress.filter(m => m.prog.percent < 100);
  const deadlines  = incomplete.slice(0, 2).map((m, i) => ({
    ...m,
    label:    i === 0 ? 'High Priority' : 'Intermediate',
    daysLeft: i === 0 ? '2 days left'  : '5 days left',
    isHigh:   i === 0,
  }));

  // Notification feed from real data
  const notifItems = useMemo(() => {
    const items: { icon: string; iconBg: string; iconColor: string; title: string; body: string; time: string }[] = [];
    const fmt = (iso: string) => {
      const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
      if (d === 0) return 'Today';
      if (d === 1) return '1 day ago';
      if (d < 7)  return `${d} days ago`;
      return `${Math.floor(d / 7)}w ago`;
    };
    quizAttempts.filter(a => a.passed).slice(0, 3).forEach(a => {
      const modId = a.quiz_id?.replace('quiz-', '');
      const mod   = modules.find(m => m.id === modId);
      items.push({ icon: 'military_tech', iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
        title: `Badge Unlocked: ${mod?.badge_title ?? 'Badge'}`,
        body: `You passed the ${mod?.title ?? 'quiz'} with ${a.score}%.`,
        time: fmt(a.attempted_at) });
    });
    progress.filter(p => p.completed_at && p.status === 'COMPLETED').slice(0, 3).forEach(p => {
      const mod = modules.find(m => m.id === p.module_id);
      const lesson = mod?.lessons?.find((l: any) => l.id === p.lesson_id);
      items.push({ icon: 'check_circle', iconBg: 'bg-green-50', iconColor: 'text-green-600',
        title: lesson?.title ?? 'Lesson completed',
        body: mod ? `${mod.title} module` : 'Keep going!',
        time: fmt(p.completed_at) });
    });
    return items.sort(() => Math.random() - 0.5).slice(0, 5);
  }, [quizAttempts, progress, modules]);

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading || !student) {
    return <PageSkeleton shape="cards" count={4} />;
  }

  const circumference = 2 * Math.PI * 65;

  return (
    <div className="flex overflow-hidden h-screen bg-neutral-50 font-body text-neutral-900">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-neutral-100 flex-col h-screen hidden lg:flex shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-10">
            <span className="material-symbols-outlined text-orange-500" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>school</span>
            <span className="text-2xl font-headline font-black text-orange-500 tracking-tight">ThalirVerse</span>
          </div>
          <nav className="space-y-1">
            {NAV_LINKS.map(link => {
              const isActive =
                link.label === 'My Learning'  ? pathname === '/dashboard' :
                link.label === 'Explore'      ? pathname.startsWith('/explore') :
                link.label === 'Achievements' ? pathname.startsWith('/profile') :
                link.label === 'Leaderboard'  ? pathname.startsWith('/leaderboard') :
                false;
              if ((link as any).disabled) {
                return (
                  <span key={link.label}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-label font-semibold text-neutral-300 cursor-not-allowed select-none">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>{link.icon}</span>
                    {link.label}
                    <span className="ml-auto text-[9px] font-black uppercase tracking-wider text-neutral-300">Soon</span>
                  </span>
                );
              }
              return (
                <Link key={link.label} href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-label font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-bold'
                      : 'text-neutral-500 hover:bg-orange-50 hover:text-orange-500'
                  }`}>
                  <span className="material-symbols-outlined"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-neutral-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-black shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{student.fullName}</p>
              <p className="text-[10px] text-neutral-500 truncate">{student.standard || 'Student'}</p>
            </div>
          </div>
          <button
            onClick={async () => { await dataService.signOut(); router.push('/login'); }}
            className="flex items-center gap-3 px-4 py-2 text-neutral-500 hover:text-red-500 transition-colors w-full">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label text-sm font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-neutral-50">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100 h-16 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-lg font-bold font-headline hidden lg:block">My Learning Dashboard</h2>
          <div className="flex items-center gap-3">
            {/* Bell + notification dropdown */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setShowNotif(v => !v)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative ${
                  showNotif ? 'bg-orange-50 text-orange-500' : 'text-neutral-500 hover:bg-neutral-100'
                }`}>
                <span className="material-symbols-outlined text-xl">notifications</span>
                {notifItems.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500" />
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden z-50">
                  {/* Dropdown header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                    <h3 className="font-headline font-black text-sm text-neutral-900">Notifications</h3>
                    <Link href="/notifications" onClick={() => setShowNotif(false)}
                      className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                      View all
                    </Link>
                  </div>

                  {/* Items */}
                  {notifItems.length === 0 ? (
                    <div className="py-10 text-center">
                      <span className="material-symbols-outlined text-3xl text-neutral-200 block mb-2"
                        style={{ fontVariationSettings: "'FILL' 1" }}>notifications_off</span>
                      <p className="text-xs text-neutral-400 font-medium">No notifications yet</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-neutral-50">
                      {notifItems.map((n, i) => (
                        <li key={i} className="flex items-start gap-3 px-5 py-4 hover:bg-neutral-50 transition-colors">
                          <div className={`w-9 h-9 rounded-xl ${n.iconBg} flex items-center justify-center shrink-0`}>
                            <span className={`material-symbols-outlined text-base ${n.iconColor}`}
                              style={{ fontVariationSettings: "'FILL' 1" }}>{n.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-neutral-800 truncate">{n.title}</p>
                            <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{n.body}</p>
                          </div>
                          <span className="text-[10px] text-neutral-400 shrink-0 pt-0.5">{n.time}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Footer */}
                  <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100">
                    <Link href="/notifications" onClick={() => setShowNotif(false)}
                      className="flex items-center justify-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                      See all notifications
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8 max-w-[1600px] mx-auto w-full space-y-8">

          {/* Locked-module notice */}
          <AnimatePresence>
            {showLockedNotice && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden">
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
                  <span className="material-symbols-outlined text-amber-600">lock</span>
                  <p className="text-sm text-amber-800 flex-1">
                    Finish your current module first — that one's still locked until you catch up on your journey below.
                  </p>
                  <button onClick={() => setShowLockedNotice(false)} className="text-amber-500 hover:text-amber-700 shrink-0">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Welcome */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-orange-500/20">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black font-headline tracking-tight">
                  Welcome back, {student.fullName.split(' ')[0]}!
                </h1>
                <p className={`mt-0.5 ${streakDanger ? 'text-red-500 font-bold' : 'text-neutral-500'}`}>
                  {streakDanger
                    ? `Your ${streak}-day streak ends tonight — keep it alive!`
                    : streak > 0
                      ? `You're on a ${streak}-day learning streak. Keep it up!`
                      : 'Start a lesson today to build your streak!'}
                </p>
                {nextMilestone && (
                  <p className="text-xs font-bold text-orange-500 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">flag</span>
                    {nextMilestone.lessonsRemaining > 0
                      ? `${nextMilestone.lessonsRemaining} lesson${nextMilestone.lessonsRemaining !== 1 ? 's' : ''} to unlock your ${nextMilestone.badgeTitle} badge (+${nextMilestone.tier - overallPercent}% overall)`
                      : `Pass the ${nextMilestone.badgeTitle} quiz to unlock your badge (+${nextMilestone.tier - overallPercent}% overall)`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-4 shrink-0">
              <motion.div
                animate={streakDanger ? { boxShadow: ['0 0 0 0 rgba(239,68,68,0.35)', '0 0 0 8px rgba(239,68,68,0)'] } : {}}
                transition={streakDanger ? { duration: 1.6, repeat: Infinity, ease: 'easeOut' } : {}}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-sm border ${
                  streakDanger ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-100'
                }`}>
                <span className={`material-symbols-outlined ${streakDanger ? 'text-red-500' : 'text-orange-500'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${streakDanger ? 'text-red-400' : 'text-neutral-400'}`}>
                    {streakDanger ? timeLeftLabel || 'Streak' : 'Streak'}
                  </p>
                  <p className={`font-black text-lg leading-tight ${streakDanger ? 'text-red-600' : ''}`}>{streak > 0 ? `${streak} Days` : '—'}</p>
                </div>
              </motion.div>
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-neutral-100">
                <span className="material-symbols-outlined text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                <div>
                  <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Credits</p>
                  <p className="font-black text-lg leading-tight">{xp.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Main grid: 8 + 4 */}
          <motion.div className="grid grid-cols-1 xl:grid-cols-12 gap-8" initial="hidden" animate="visible" variants={staggerContainer}>

            {/* Left column */}
            <div className="xl:col-span-8 space-y-8">

              {/* Progress + Active module */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Circular progress */}
                <motion.div variants={fadeUp} className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 flex flex-col items-center justify-center text-center">
                  <h3 className="font-bold font-headline text-lg mb-6 self-start">Course Progress</h3>
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-40 h-40">
                      <circle cx="80" cy="80" r="65" fill="transparent" stroke="#f5f5f5" strokeWidth="12" />
                      <motion.circle cx="80" cy="80" r="65" fill="transparent" stroke="#FF9933"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference * (1 - overallPercent / 100) }}
                        transition={springSoft}
                        strokeLinecap="round" strokeWidth="12"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black font-headline">{overallPercent}%</span>
                      <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">Total</span>
                    </div>
                  </div>
                  <p className="mt-6 text-sm text-neutral-500 font-medium">{completedCount} of {totalCount} modules completed</p>
                </motion.div>

                {/* Active course */}
                {activeModule ? (
                  <motion.div variants={fadeUp} className={`md:col-span-2 relative group overflow-hidden rounded-2xl shadow-lg min-h-[300px] bg-gradient-to-br ${moduleTheme(activeModule.id).strong.from} ${moduleTheme(activeModule.id).strong.to}`}>
                    {moduleTheme(activeModule.id).image && (
                      <img src={moduleTheme(activeModule.id).image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="relative h-full flex flex-col justify-end p-8 text-white">
                      <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-md w-max mb-4 tracking-widest">
                        {activeModule.prog.percent > 0 ? 'Continue Watching' : 'Start Learning'}
                      </span>
                      <h2 className="text-3xl font-black font-headline mb-3">{activeModule.title}</h2>
                      {activeModule.lessons?.[activeModule.prog.completed] && (
                        <p className="text-neutral-300 text-sm mb-6 max-w-md line-clamp-1">
                          Lesson {activeModule.prog.completed + 1}: {activeModule.lessons[activeModule.prog.completed]?.title}
                        </p>
                      )}
                      <div className="flex items-center gap-6">
                        <Link href={`/courses/${activeModule.id}`}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-xl transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-orange-500/30">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                          {activeModule.prog.percent > 0 ? 'Resume Learning' : 'Start Learning'}
                        </Link>
                        {activeModule.prog.total > 0 && (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-32 bg-white/20 h-2 rounded-full overflow-hidden">
                                <div className="bg-orange-400 h-full rounded-full transition-all duration-700"
                                  style={{ width: `${activeModule.prog.percent}%` }} />
                              </div>
                              <span className="text-sm font-bold">{activeModule.prog.percent}%</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                              Module {activeModule.prog.completed + 1}/{activeModule.prog.total}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="md:col-span-2 bg-white rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-center min-h-[300px]">
                    <div className="text-center text-neutral-400">
                      <span className="material-symbols-outlined text-5xl mb-3 block">auto_stories</span>
                      <p className="text-sm font-bold">No active course</p>
                      <p className="text-xs mt-1">Courses appear here once published.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Journey roadmap */}
              <motion.section variants={fadeUp}>
                <JourneyRoadmap modules={modules} progress={progress} quizAttempts={quizAttempts} />
              </motion.section>
            </div>

            {/* Right column */}
            <div className="xl:col-span-4 space-y-8">

              {/* Class Progress — collective, non-comparative */}
              <ClassProgressPanel student={{ school: student.school, standard: student.standard }} />

              {/* Upcoming Deadlines */}
              <motion.div variants={fadeUp} className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold font-headline text-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-orange-500">calendar_today</span>
                    Upcoming Deadlines
                  </h3>
                  {deadlines.length > 0 && (
                    <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">
                      {deadlines.length} Tasks
                    </span>
                  )}
                </div>

                {deadlines.length > 0 ? (
                  <div className="space-y-4">
                    {deadlines.map((d) => (
                      <div key={d.id}
                        className={`group cursor-pointer p-4 rounded-2xl border transition-colors ${
                          d.isHigh
                            ? 'bg-red-50 border-red-100 hover:border-red-300'
                            : 'bg-orange-50 border-orange-100 hover:border-orange-300'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${d.isHigh ? 'text-red-600' : 'text-orange-600'}`}>
                            {d.label}
                          </span>
                          <span className={`text-[10px] font-bold ${d.isHigh ? 'text-red-500' : 'text-orange-500'}`}>
                            {d.daysLeft}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            d.isHigh ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            <span className="material-symbols-outlined">{d.isHigh ? 'assignment' : 'quiz'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-black truncate">{d.title}</h5>
                            <p className="text-xs text-neutral-500 truncate">{d.category}</p>
                          </div>
                          <Link href={`/courses/${d.id}`}>
                            <span className={`material-symbols-outlined transition-colors ${d.isHigh ? 'text-neutral-400 group-hover:text-red-500' : 'text-neutral-400 group-hover:text-orange-500'}`}>
                              chevron_right
                            </span>
                          </Link>
                        </div>
                      </div>
                    ))}
                    <button className="w-full mt-2 py-3 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 text-sm font-bold hover:border-orange-200 hover:text-orange-500 transition-colors">
                      View All Tasks
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <span className="material-symbols-outlined text-3xl text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <p className="text-xs text-neutral-400 mt-2 font-medium">All caught up! No pending tasks.</p>
                  </div>
                )}
              </motion.div>

              {/* Achievements */}
              <motion.div variants={fadeUp} className="bg-neutral-100 p-8 rounded-2xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-bold font-headline text-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                    Achievements
                  </h3>
                  <Link href="/profile" className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                    View All
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {moduleProgress.slice(0, 4).map(m => {
                    const earned = m.prog.percent === 100;
                    const colors = moduleTheme(m.id).soft;
                    const icon = moduleTheme(m.id).icon;
                    return (
                      <motion.div key={m.id}
                        whileHover={earned ? { scale: 1.04 } : undefined}
                        whileTap={earned ? { scale: 0.97 } : undefined}
                        onClick={() => earned && setSelectedBadge({ module: m, icon, colors, earnedAt: getBadgeEarnedDate(m) })}
                        className={`bg-white p-5 rounded-2xl shadow-sm text-center flex flex-col items-center group ${
                          earned ? 'cursor-pointer' : 'opacity-50 grayscale'
                        }`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${earned ? colors.bg : 'bg-neutral-100'}`}>
                          <span className={`material-symbols-outlined ${earned ? colors.icon : 'text-neutral-400'}`}
                            style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
                            {icon}
                          </span>
                        </div>
                        <h6 className="text-xs font-black mb-1 leading-tight">{m.badge_title || m.title}</h6>
                        <p className="text-[10px] text-neutral-400">{earned ? 'Earned' : 'Locked'}</p>
                      </motion.div>
                    );
                  })}
                  {moduleProgress.length < 4 && (
                    <div className="border-2 border-dashed border-neutral-200 p-5 rounded-2xl text-center flex flex-col items-center justify-center opacity-60">
                      <span className="material-symbols-outlined text-neutral-400 mb-2 text-2xl">lock</span>
                      <p className="text-[10px] font-bold text-neutral-500">More to earn</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* ── Badge detail modal ── */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedBadge(null)}>
            <motion.div variants={popIn} initial="hidden" animate="visible" exit="hidden"
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center"
              onClick={e => e.stopPropagation()}>
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ring-4 ${selectedBadge.colors.bg} ${selectedBadge.colors.ring}`}>
                <span className={`material-symbols-outlined ${selectedBadge.colors.icon}`}
                  style={{ fontSize: 44, fontVariationSettings: "'FILL' 1" }}>
                  {selectedBadge.icon}
                </span>
              </div>
              <h3 className="font-headline font-black text-xl mt-5">
                {selectedBadge.module.badge_title || selectedBadge.module.title}
              </h3>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                {selectedBadge.module.description || `Awarded for completing ${selectedBadge.module.title}.`}
              </p>
              {selectedBadge.earnedAt && (
                <p className="text-xs text-orange-500 font-bold font-label mt-4">
                  ✓ Earned on {selectedBadge.earnedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              <button onClick={() => setSelectedBadge(null)}
                className="w-full mt-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition-all">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Streak-broken modal (shown once per break event) ── */}
      <AnimatePresence>
        {streakBrokenModal !== null && (
          <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setStreakBrokenModal(null)}>
            <motion.div variants={popIn} initial="hidden" animate="visible" exit="hidden"
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center"
              onClick={e => e.stopPropagation()}>
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                {[...Array(6)].map((_, i) => (
                  <motion.span key={i}
                    className="absolute w-2 h-2 rounded-full bg-neutral-300"
                    initial={{ opacity: 0.8, x: 0, y: 0, scale: 1 }}
                    animate={{
                      opacity: 0,
                      x: Math.cos((i / 6) * Math.PI * 2) * 40,
                      y: Math.sin((i / 6) * Math.PI * 2) * 40,
                      scale: 0.3,
                    }}
                    transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }} />
                ))}
                <motion.span className="material-symbols-outlined text-neutral-300 relative"
                  style={{ fontSize: 44, fontVariationSettings: "'FILL' 1" }}
                  initial={{ scale: 1.3 }} animate={{ scale: 0.85 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
                  local_fire_department
                </motion.span>
              </div>
              <h3 className="font-headline font-black text-xl mt-5 text-neutral-800">Streak Lost</h3>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                Your {streakBrokenModal}-day streak ended — but every learner has an off day.
                Start a lesson today to begin a new one!
              </p>
              <button onClick={() => { setStreakBrokenModal(null); router.push('/explore'); }}
                className="w-full mt-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all">
                Start Today's Lesson
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CelebrationRocket
        show={celebratingMilestone !== null}
        onDone={handleMilestoneCelebrationDone}
        tier={celebratingMilestone ?? 0}
        label={celebratingMilestone ? MILESTONE_LABELS[celebratingMilestone] : ''}
      />

      <OnboardingModal />
    </div>
  );
}
