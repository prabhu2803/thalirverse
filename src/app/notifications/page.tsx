'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { dataService } from '@/lib/supabaseClient';

const NAV_LINKS = [
  { label: 'Home',         href: '/',          icon: 'home' },
  { label: 'My Learning',  href: '/dashboard', icon: 'auto_stories' },
  { label: 'Explore',      href: '/explore',   icon: 'search' },
  { label: 'Achievements', href: '/profile',   icon: 'military_tech' },
  { label: 'Community',    href: '#',          icon: 'groups', disabled: true },
];

type NotifType = 'achievement' | 'module' | 'reminder' | 'certificate';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
}

const TYPE_META: Record<NotifType, { icon: string; color: string; bg: string }> = {
  achievement: { icon: 'workspace_premium', color: 'text-amber-600', bg: 'bg-amber-50' },
  module:      { icon: 'check_circle',      color: 'text-green-600', bg: 'bg-green-50' },
  reminder:    { icon: 'alarm',             color: 'text-blue-600',  bg: 'bg-blue-50'  },
  certificate: { icon: 'star',              color: 'text-orange-600',bg: 'bg-orange-50' },
};

const FILTERS = ['All', 'Achievements', 'Reminders', 'Modules'] as const;
type Filter = typeof FILTERS[number];

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 2)  return 'Yesterday';
  return `${d} days ago`;
}

function isYesterday(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d >= 1 && d < 2;
}

function isRecent(iso: string) {
  return (Date.now() - new Date(iso).getTime()) < 86400000;
}

/* Build notification feed from progress + quiz_attempts */
function buildNotifications(
  modules: any[],
  progress: any[],
  quizAttempts: any[],
  isGraduate: boolean
): Notification[] {
  const items: Notification[] = [];

  // Module completions
  modules.forEach(m => {
    const lessons = m.lessons ?? [];
    const allDone = lessons.length > 0 && lessons.every((l: any) =>
      progress.some(p => p.lesson_id === l.id && p.status === 'COMPLETED')
    );
    if (allDone) {
      const lastProgress = [...progress]
        .filter(p => lessons.some((l: any) => l.id === p.lesson_id))
        .sort((a, b) => new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime())[0];
      if (lastProgress?.completed_at) {
        items.push({
          id: `mod-${m.id}`,
          type: 'module',
          title: `${m.title} Module Completed!`,
          body: `Great work! You've completed all lessons in ${m.title}.`,
          createdAt: lastProgress.completed_at,
          read: false,
          actionLabel: 'Take Quiz',
          actionHref: `/quiz/${m.id}`,
        });
      }
    }
  });

  // Quiz pass achievements
  quizAttempts.filter(a => a.passed).forEach(a => {
    const modId = a.quiz_id?.replace('quiz-', '');
    const mod   = modules.find(m => m.id === modId);
    if (mod && a.attempted_at) {
      items.push({
        id: `quiz-${a.quiz_id}-${a.attempted_at}`,
        type: 'achievement',
        title: `Badge Unlocked: ${mod.badge_title || mod.title}`,
        body: `You passed the ${mod.title} quiz with a score of ${a.score}%. Your badge has been added to your profile.`,
        createdAt: a.attempted_at,
        read: false,
        actionLabel: 'View Badge',
        actionHref: '/profile',
      });
    }
  });

  // Graduate certificate
  if (isGraduate) {
    const lastAttempt = [...quizAttempts].filter(a => a.passed)
      .sort((a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime())[0];
    if (lastAttempt) {
      items.push({
        id: 'certificate',
        type: 'certificate',
        title: 'Thalir Graduate Certificate Ready!',
        body: 'You\'ve completed all modules. Your Thalir Graduate certificate is now available for download.',
        createdAt: lastAttempt.attempted_at,
        read: false,
        actionLabel: 'Download PDF',
        actionHref: '/profile',
      });
    }
  }

  // Sort newest first
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function Notifications() {
  const router   = useRouter();
  const pathname = usePathname();
  const [student,      setStudent]      = useState<any>(null);
  const [modules,      setModules]      = useState<any[]>([]);
  const [progress,     setProgress]     = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState<Filter>('All');
  const [readIds,      setReadIds]      = useState<Set<string>>(new Set());

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
        setQuizAttempts(attempts);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const isGraduate = useMemo(() =>
    modules.length > 0 && modules.every(m => {
      const lessons = m.lessons ?? [];
      if (!lessons.length) return quizAttempts.some(a => a.quiz_id === `quiz-${m.id}` && a.passed);
      return lessons.every((l: any) => progress.some(p => p.lesson_id === l.id && p.status === 'COMPLETED'));
    }),
  [modules, progress, quizAttempts]);

  const notifications = useMemo(
    () => buildNotifications(modules, progress, quizAttempts, isGraduate),
    [modules, progress, quizAttempts, isGraduate]
  );

  const filtered = useMemo(() => notifications.filter(n => {
    if (filter === 'All')          return true;
    if (filter === 'Achievements') return n.type === 'achievement' || n.type === 'certificate';
    if (filter === 'Reminders')    return n.type === 'reminder';
    if (filter === 'Modules')      return n.type === 'module';
    return true;
  }), [notifications, filter]);

  const unreadCount  = notifications.filter(n => !readIds.has(n.id)).length;
  const recentItems  = filtered.filter(n => isRecent(n.createdAt));
  const oldItems     = filtered.filter(n => !isRecent(n.createdAt));

  const completedModules = modules.filter(m => {
    const lessons = m.lessons ?? [];
    if (!lessons.length) return quizAttempts.some(a => a.quiz_id === `quiz-${m.id}` && a.passed);
    return lessons.every((l: any) => progress.some(p => p.lesson_id === l.id && p.status === 'COMPLETED'));
  });
  const goalPercent = modules.length > 0 ? Math.round((completedModules.length / modules.length) * 100) : 0;

  const markAllRead = () => setReadIds(new Set(notifications.map(n => n.id)));
  const markRead    = (id: string) => setReadIds(prev => new Set([...prev, id]));

  if (loading || !student) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
          <span className="animate-spin text-4xl">⏳</span>
          <span>Loading Notifications...</span>
        </div>
      </div>
    );
  }

  const FILTER_ICONS: Record<string, string> = {
    'All': 'all_inbox',
    'Achievements': 'workspace_premium',
    'Reminders': 'event_note',
    'Modules': 'auto_stories',
  };

  const NotifItem = ({ n }: { n: Notification }) => {
    const meta  = TYPE_META[n.type];
    const isNew = !readIds.has(n.id);
    return (
      <div onClick={() => markRead(n.id)}
        className="notification-card group relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex gap-4 overflow-hidden cursor-pointer">
        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${meta.bg} flex items-center justify-center ${meta.color}`}>
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className={`font-bold ${isNew ? 'text-slate-900' : 'text-slate-700'} truncate`}>{n.title}</h3>
            <span className="text-xs font-medium text-slate-400 shrink-0">{relTime(n.createdAt)}</span>
          </div>
          <p className="text-slate-600 text-sm mt-1 line-clamp-2">{n.body}</p>
          {n.actionLabel && n.actionHref && (
            <div className="mt-4 flex gap-2">
              <Link href={n.actionHref} onClick={e => e.stopPropagation()}
                className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors">
                {n.actionLabel}
              </Link>
            </div>
          )}
        </div>
        {isNew && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />}
      </div>
    );
  };

  const initials = student.fullName.trim().split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex overflow-hidden h-screen bg-neutral-50 font-body text-neutral-900">

      {/* ── Sidebar ── same as dashboard/profile/explore ── */}
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
                    <span className="material-symbols-outlined">{link.icon}</span>
                    {link.label}
                    <span className="ml-auto text-[9px] font-black uppercase tracking-wider">Soon</span>
                  </span>
                );
              }
              return (
                <Link key={link.label} href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-label font-semibold transition-all ${
                    isActive ? 'bg-orange-50 text-orange-600 font-bold' : 'text-neutral-500 hover:bg-orange-50 hover:text-orange-500'
                  }`}>
                  <span className="material-symbols-outlined"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{link.icon}</span>
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
          <button onClick={async () => { await dataService.signOut(); router.push('/login'); }}
            className="flex items-center gap-3 px-4 py-2 text-neutral-500 hover:text-red-500 transition-colors w-full">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label text-sm font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100 h-16 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-base font-headline font-bold text-neutral-700">Notification Center</h2>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
              Mark all as read
            </button>
          )}
        </header>

        <main className="p-8 max-w-5xl w-full">

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-6">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-label font-semibold transition-all ${
                  filter === f
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white border border-neutral-100 text-neutral-500 hover:border-orange-200 hover:text-orange-500'
                }`}>
                <span className="material-symbols-outlined text-sm">{FILTER_ICONS[f]}</span>
                {f}
                {f === 'All' && unreadCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    filter === 'All' ? 'bg-white/30 text-white' : 'bg-orange-100 text-orange-600'
                  }`}>{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Weekly goal strip */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white mb-6 flex items-center justify-between gap-4 overflow-hidden relative">
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-sm font-bold mb-2">Weekly Goal — {goalPercent}% of targets completed</p>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden max-w-sm">
                <div className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(goalPercent, 100)}%` }} />
              </div>
            </div>
            <span className="material-symbols-outlined text-white/20 text-6xl shrink-0 rotate-12"
              style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          </div>

          {/* Notification list */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-neutral-200 mb-3 block"
                style={{ fontVariationSettings: "'FILL' 1" }}>notifications_off</span>
              <p className="text-sm text-neutral-400 font-medium">No notifications yet.</p>
              <Link href="/dashboard" className="mt-3 inline-block text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">
                Start a lesson to earn your first badge →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentItems.length > 0 && (
                <>
                  <p className="text-xs font-label font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                    Recent {unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />}
                  </p>
                  {recentItems.map(n => <NotifItem key={n.id} n={n} />)}
                </>
              )}
              {oldItems.length > 0 && (
                <>
                  <p className="text-xs font-label font-bold text-neutral-400 uppercase tracking-widest mt-6">Earlier</p>
                  {oldItems.map(n => <NotifItem key={n.id} n={n} />)}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
