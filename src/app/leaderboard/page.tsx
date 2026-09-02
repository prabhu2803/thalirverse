'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { dataService } from '@/lib/supabaseClient';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { PageSkeleton } from '@/components/motion/Skeleton';

const NAV_LINKS = [
  { label: 'My Learning',  href: '/dashboard',   icon: 'auto_stories' },
  { label: 'Explore',      href: '/explore',     icon: 'search' },
  { label: 'Achievements', href: '/profile',     icon: 'military_tech' },
  { label: 'Leaderboard',  href: '/leaderboard', icon: 'leaderboard' },
];

const RANK_STYLE: Record<number, { bg: string; text: string; icon: string }> = {
  1: { bg: 'bg-gradient-to-br from-amber-300 to-amber-500', text: 'text-white', icon: 'workspace_premium' },
  2: { bg: 'bg-gradient-to-br from-neutral-300 to-neutral-400', text: 'text-white', icon: 'workspace_premium' },
  3: { bg: 'bg-gradient-to-br from-orange-300 to-orange-500', text: 'text-white', icon: 'workspace_premium' },
};

export default function Leaderboard() {
  const router   = useRouter();
  const pathname = usePathname();
  const [student, setStudent]   = useState<any>(null);
  const [rows,    setRows]      = useState<{ full_name: string; xp: number; rank: number; is_self: boolean }[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await dataService.getActiveStudent();
        if (!s) { router.push('/login'); return; }
        setStudent(s);
        setRows(await dataService.getLeaderboard(20));
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const initials = student?.fullName
    ? student.fullName.trim().split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (loading || !student) {
    return <PageSkeleton shape="rows" count={6} />;
  }

  return (
    <div className="flex overflow-hidden h-screen bg-neutral-50 font-body text-neutral-900">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
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

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">

        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100 h-16 flex items-center px-8 shadow-sm">
          <h2 className="text-base font-headline font-bold text-neutral-700">Leaderboard</h2>
        </header>

        <main className="p-8 max-w-2xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-headline font-black text-neutral-900 tracking-tight">Your School's Top Learners</h1>
            <p className="text-neutral-500 mt-1">
              Ranked by XP — school-only, so it's a fair fight regardless of school size.
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-neutral-100 shadow-sm">
              <span className="material-symbols-outlined text-5xl text-neutral-200 mb-4">leaderboard</span>
              <p className="text-lg font-bold text-neutral-500">No ranked students yet</p>
              <p className="text-sm text-neutral-400 mt-1">Complete a quiz to earn XP and appear here.</p>
            </div>
          ) : (
            <motion.div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100 overflow-hidden"
              initial="hidden" animate="visible" variants={staggerContainer}>
              {rows.map((r, i) => {
                const style = RANK_STYLE[r.rank];
                return (
                  <motion.div key={`${r.rank}-${i}`} variants={fadeUp}
                    className={`flex items-center gap-4 px-6 py-4 ${r.is_self ? 'bg-orange-50/60' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${
                      style ? `${style.bg} ${style.text}` : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {style ? <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{style.icon}</span> : r.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${r.is_self ? 'text-orange-600' : 'text-neutral-800'}`}>
                        {r.full_name}{r.is_self ? ' (You)' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-orange-500 font-black text-sm shrink-0">
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      {r.xp.toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
