'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { dataService } from '@/lib/supabaseClient';

/* ─── helpers ─────────────────────────────────────────────────────── */

function computeStreak(progress: any[]): number {
  const dates = new Set(
    progress.filter(p => p.completed_at).map(p => new Date(p.completed_at).toISOString().split('T')[0])
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (dates.has(d.toISOString().split('T')[0])) { streak++; }
    else if (i > 0) break;
  }
  return streak;
}

function getModuleProgress(moduleId: string, lessons: any[], progress: any[], quizAttempts: any[]) {
  if (!lessons?.length) {
    const passed = quizAttempts.some(a => a.quiz_id === `quiz-${moduleId}` && a.passed);
    return { percent: passed ? 100 : 0, completed: 0, total: 0 };
  }
  const ids = lessons.map((l: any) => l.id);
  const done = progress.filter(p => ids.includes(p.lesson_id) && p.status === 'COMPLETED').length;
  return { percent: Math.round((done / lessons.length) * 100), completed: done, total: lessons.length };
}

const NAV_LINKS = [
  { label: 'My Learning',  href: '/dashboard', icon: 'auto_stories' },
  { label: 'Explore',      href: '/explore',   icon: 'search' },
  { label: 'Achievements', href: '/profile',   icon: 'military_tech' },
];

const MODULE_ICONS: Record<string, string> = {
  'road-safety': 'local_police',
  'masoom': 'shield',
  'entrepreneurship': 'rocket_launch',
  'leadership': 'stars',
};

const MODULE_COLORS: Record<string, { bg: string; icon: string; ring: string }> = {
  'road-safety':     { bg: 'bg-yellow-50', icon: 'text-yellow-600', ring: 'ring-yellow-200' },
  'masoom':          { bg: 'bg-blue-50',   icon: 'text-blue-600',   ring: 'ring-blue-200' },
  'entrepreneurship':{ bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-200' },
  'leadership':      { bg: 'bg-green-50',  icon: 'text-green-600',  ring: 'ring-green-200' },
};

const COURSE_GRADIENTS: Record<string, string> = {
  'road-safety':      'bg-gradient-to-br from-amber-700 to-amber-900',
  'masoom':           'bg-gradient-to-br from-blue-700 to-blue-900',
  'entrepreneurship': 'bg-gradient-to-br from-purple-700 to-purple-900',
  'leadership':       'bg-gradient-to-br from-green-700 to-green-900',
};

/* ─── component ───────────────────────────────────────────────────── */

export default function Dashboard() {
  const router   = useRouter();
  const pathname = usePathname();
  const [showNotif,  setShowNotif]  = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [student, setStudent]   = useState<any>(null);
  const [modules, setModules]   = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [quizAttempts, setQuiz] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

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
  const xp      = student?.xp ?? 0;
  const initials = useMemo(() => {
    if (!student?.fullName) return '?';
    const parts = student.fullName.trim().split(' ');
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }, [student]);

  const moduleProgress = useMemo(
    () => modules.map(m => ({ ...m, prog: getModuleProgress(m.id, m.lessons, progress, quizAttempts) })),
    [modules, progress, quizAttempts]
  );

  const completedCount = moduleProgress.filter(m => m.prog.percent === 100).length;
  const totalCount     = modules.length;
  const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
          <span className="animate-spin text-4xl">⏳</span>
          <span>Loading ThalirVerse...</span>
        </div>
      </div>
    );
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
                <p className="text-neutral-500 mt-0.5">
                  {streak > 0
                    ? `You're on a ${streak}-day learning streak. Keep it up!`
                    : 'Start a lesson today to build your streak!'}
                </p>
              </div>
            </div>
            <div className="flex gap-4 shrink-0">
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-neutral-100">
                <span className="material-symbols-outlined text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <div>
                  <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Streak</p>
                  <p className="font-black text-lg leading-tight">{streak > 0 ? `${streak} Days` : '—'}</p>
                </div>
              </div>
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
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

            {/* Left column */}
            <div className="xl:col-span-8 space-y-8">

              {/* Progress + Active module */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Circular progress */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 flex flex-col items-center justify-center text-center">
                  <h3 className="font-bold font-headline text-lg mb-6 self-start">Course Progress</h3>
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-40 h-40">
                      <circle cx="80" cy="80" r="65" fill="transparent" stroke="#f5f5f5" strokeWidth="12" />
                      <circle cx="80" cy="80" r="65" fill="transparent" stroke="#FF9933"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - overallPercent / 100)}
                        strokeLinecap="round" strokeWidth="12"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.7s ease' }} />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black font-headline">{overallPercent}%</span>
                      <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">Total</span>
                    </div>
                  </div>
                  <p className="mt-6 text-sm text-neutral-500 font-medium">{completedCount} of {totalCount} modules completed</p>
                </div>

                {/* Active course */}
                {activeModule ? (
                  <div className={`md:col-span-2 relative group overflow-hidden rounded-2xl shadow-lg min-h-[300px] ${COURSE_GRADIENTS[activeModule.id] ?? 'bg-neutral-900'}`}>
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
                  </div>
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

              {/* Enrolled courses */}
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black font-headline tracking-tight">Enrolled Courses</h3>
                  <Link href="/profile" className="text-orange-500 font-bold text-sm flex items-center gap-1 hover:underline">
                    View All <span className="material-symbols-outlined">chevron_right</span>
                  </Link>
                </div>

                {moduleProgress.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-neutral-100 shadow-sm text-neutral-400">
                    <span className="material-symbols-outlined text-4xl mb-3">auto_stories</span>
                    <p className="text-sm font-bold">No courses yet</p>
                    <p className="text-xs mt-1">Courses will appear here once published.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {moduleProgress.map(m => {
                      const isComplete = m.prog.percent === 100;
                      const hasStarted = m.prog.percent > 0;
                      const icon = isComplete ? 'verified' : (MODULE_ICONS[m.id] ?? 'auto_stories');
                      return (
                        <div key={m.id} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow flex gap-6 items-start">
                          <div className={`w-24 h-24 rounded-2xl flex-shrink-0 flex items-center justify-center ${
                            isComplete ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'
                          }`}>
                            <span className="material-symbols-outlined" style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <h4 className="font-bold font-headline text-lg mb-1 truncate">{m.title}</h4>
                                <p className="text-sm text-neutral-500 mb-4 line-clamp-1">{m.description}</p>
                              </div>
                              <button className="text-neutral-400 hover:text-neutral-600 shrink-0">
                                <span className="material-symbols-outlined">more_vert</span>
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                                isComplete  ? 'text-green-600 bg-green-50' :
                                hasStarted  ? 'text-orange-500 bg-orange-50' :
                                              'text-neutral-400 bg-neutral-100'
                              }`}>
                                {isComplete ? 'Completed' : hasStarted ? `${m.prog.percent}% Done` : 'Pending'}
                              </span>
                              {isComplete && (
                                <Link href="/profile" className="text-sm font-bold text-orange-500 hover:underline">
                                  View Certificate
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Right column */}
            <div className="xl:col-span-4 space-y-8">

              {/* Upcoming Deadlines */}
              <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
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
              </div>

              {/* Achievements */}
              <div className="bg-neutral-100 p-8 rounded-2xl">
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
                  {moduleProgress.slice(0, 3).map(m => {
                    const earned = m.prog.percent === 100;
                    const colors = MODULE_COLORS[m.id] ?? { bg: 'bg-neutral-50', icon: 'text-neutral-400', ring: 'ring-neutral-200' };
                    const icon = MODULE_ICONS[m.id] ?? 'workspace_premium';
                    return (
                      <div key={m.id}
                        className={`bg-white p-5 rounded-2xl shadow-sm text-center flex flex-col items-center group cursor-pointer hover:scale-[1.02] transition-transform ${
                          !earned ? 'opacity-50 grayscale' : ''
                        }`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${earned ? colors.bg : 'bg-neutral-100'}`}>
                          <span className={`material-symbols-outlined ${earned ? colors.icon : 'text-neutral-400'}`}
                            style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
                            {icon}
                          </span>
                        </div>
                        <h6 className="text-xs font-black mb-1 leading-tight">{m.badge_title || m.title}</h6>
                        <p className="text-[10px] text-neutral-400">{earned ? 'Earned' : 'Locked'}</p>
                      </div>
                    );
                  })}
                  <div className="border-2 border-dashed border-neutral-200 p-5 rounded-2xl text-center flex flex-col items-center justify-center opacity-60">
                    <span className="material-symbols-outlined text-neutral-400 mb-2 text-2xl">lock</span>
                    <p className="text-[10px] font-bold text-neutral-500">More to earn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
