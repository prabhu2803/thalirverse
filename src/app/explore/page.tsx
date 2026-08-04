'use client';

import { useEffect, useState } from 'react';
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

const MODULE_ICONS: Record<string, string> = {
  'road-safety':      'local_police',
  'masoom':           'shield',
  'entrepreneurship': 'rocket_launch',
  'leadership':       'stars',
};

const MODULE_COLORS: Record<string, { bg: string; icon: string; gradient: string }> = {
  'road-safety':      { bg: 'bg-amber-50',  icon: 'text-amber-600',  gradient: 'from-amber-500 to-amber-700' },
  'masoom':           { bg: 'bg-blue-50',   icon: 'text-blue-600',   gradient: 'from-blue-500 to-blue-700' },
  'entrepreneurship': { bg: 'bg-purple-50', icon: 'text-purple-600', gradient: 'from-purple-500 to-purple-700' },
  'leadership':       { bg: 'bg-green-50',  icon: 'text-green-600',  gradient: 'from-green-500 to-green-700' },
};

export default function Explore() {
  const router   = useRouter();
  const pathname = usePathname();
  const [student,  setStudent]  = useState<any>(null);
  const [modules,  setModules]  = useState<any[]>([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await dataService.getActiveStudent();
        if (!s) { router.push('/login'); return; }
        setStudent(s);
        const mods = await dataService.getModules();
        setModules(mods);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const initials = student?.fullName
    ? student.fullName.trim().split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const filtered = modules.filter(m =>
    !search ||
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || !student) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
          <span className="animate-spin text-4xl">⏳</span>
          <span>Loading Courses...</span>
        </div>
      </div>
    );
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

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100 h-16 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-base font-headline font-bold text-neutral-700">Explore Courses</h2>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search modules..."
                className="pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-full text-sm focus:outline-none focus:border-orange-400 w-52 transition-all"
              />
            </div>
            <Link href="/notifications"
              className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="p-8 max-w-[1400px] mx-auto w-full">

          {/* Page heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-headline font-black text-neutral-900 tracking-tight">All Courses</h1>
            <p className="text-neutral-500 mt-1">
              {modules.length} module{modules.length !== 1 ? 's' : ''} available · Pick a track and start learning
            </p>
          </div>

          {/* Module grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-5xl text-neutral-200 mb-4">search_off</span>
              <p className="text-lg font-bold text-neutral-500">No courses match "{search}"</p>
              <button onClick={() => setSearch('')}
                className="mt-3 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(m => {
                const colors = MODULE_COLORS[m.id] ?? { bg: 'bg-neutral-50', icon: 'text-neutral-500', gradient: 'from-neutral-500 to-neutral-700' };
                const icon   = MODULE_ICONS[m.id] ?? 'auto_stories';
                const lessonCount = m.lessons?.length ?? 0;
                return (
                  <Link key={m.id} href={`/courses/${m.id}`}
                    className="group bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                    {/* Card header */}
                    <div className={`bg-gradient-to-br ${colors.gradient} p-8 flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 52, fontVariationSettings: "'FILL' 1" }}>
                        {icon}
                      </span>
                    </div>
                    {/* Card body */}
                    <div className="p-5 flex-1 flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full w-max mb-3 ${colors.bg} ${colors.icon}`}>
                        {m.category}
                      </span>
                      <h3 className="font-headline font-black text-base text-neutral-900 mb-1 leading-tight">{m.title}</h3>
                      <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed flex-1">{m.description}</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                        <span className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                          <span className="material-symbols-outlined text-sm">play_lesson</span>
                          {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-orange-500 group-hover:gap-2 transition-all">
                          Start
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
