'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { dataService } from '@/lib/supabaseClient';
import { StaggerGrid, StaggerItem } from '@/components/motion/StaggerGrid';
import { PageSkeleton } from '@/components/motion/Skeleton';
import { isModuleUnlocked, getNextLessonUnlockIndex, shouldSuggestNaturalStop } from '@/lib/gamification';

// Same sidebar as the dashboard/profile/explore/notifications pages — same
// links, same expanded (labelled) layout — so it doesn't visibly change
// shape when a student opens a course.
const NAV_LINKS = [
  { label: 'My Learning',  href: '/dashboard',   icon: 'auto_stories' },
  { label: 'Explore',      href: '/explore',     icon: 'search' },
  { label: 'Achievements', href: '/profile',     icon: 'military_tech' },
  { label: 'Leaderboard',  href: '/leaderboard', icon: 'leaderboard' },
];

const TABS = ['Overview', 'Notes', 'Discussions', 'Reviews'];

export default function CourseView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const pathname = usePathname();

  const [student,        setStudent]      = useState<any>(null);
  const [course,         setCourse]       = useState<any>(null);
  const [activeLesson,   setActiveLesson] = useState<any>(null);
  const [progress,       setProgress]     = useState<any[]>([]);
  const [quizAttempts,   setQuizAttempts] = useState<any[]>([]);
  const [loading,        setLoading]      = useState(true);
  const [watchProgress,  setWatchPct]     = useState(0);
  const [isCompleted,    setIsCompleted]  = useState(false);
  const [activeTab,      setActiveTab]    = useState('Overview');
  const [showStopBanner, setShowStopBanner] = useState(false);

  const isCompletedRef  = useRef(false);
  const playerRef       = useRef<any>(null);
  const intervalRef     = useRef<any>(null);

  const getYouTubeId = (url: string) => {
    const m = url?.match(/(?:youtu\.be\/|v=|embed\/)([^#&?]{11})/);
    return m?.[1] ?? null;
  };

  useEffect(() => {
    (async () => {
      try {
        const s = await dataService.getActiveStudent();
        setStudent(s);
        const [c, mods] = await Promise.all([dataService.getModule(id), dataService.getModules()]);
        setCourse(c);
        let prog: any[] = [];
        let attempts: any[] = [];
        if (s) {
          [prog, attempts] = await Promise.all([dataService.getProgress(s.id), dataService.getQuizAttempts(s.id)]);
          setProgress(prog);
          setQuizAttempts(attempts);
        }
        // Real sequential unlock: bounce back if this module's prerequisites
        // aren't met, rather than just cosmetically dimming its lessons.
        if (c && mods.length && !isModuleUnlocked(c, mods, prog, attempts)) {
          router.push(`/dashboard?locked=${id}`);
          return;
        }
        if (c?.lessons?.length) {
          const unlockIdx = getNextLessonUnlockIndex(c.lessons, prog);
          setActiveLesson(c.lessons[unlockIdx] ?? c.lessons[0]);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [id]);

  useEffect(() => {
    if (!activeLesson || typeof window === 'undefined') return;
    const existing = progress.find(p => p.lesson_id === activeLesson.id);
    const done = existing?.status === 'COMPLETED';
    isCompletedRef.current = done;
    setIsCompleted(done);
    setWatchPct(0);

    // PDF/PRESENTATION lessons don't use the YouTube player at all — the
    // reset above still needs to run for every lesson type (so switching
    // lessons doesn't leave stale isCompleted/watchPct behind), but nothing
    // past this point applies to them.
    if ((activeLesson.lesson_type ?? 'VIDEO') !== 'VIDEO') return;
    const videoId = getYouTubeId(activeLesson.content_url ?? '');
    if (!videoId) return;

    let script = document.getElementById('yt-api') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id  = 'yt-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }

    const init = () => {
      playerRef.current?.destroy?.();
      playerRef.current = new (window as any).YT.Player('yt-frame', {
        videoId, height: '100%', width: '100%',
        playerVars: { playsinline: 1, modestbranding: 1, rel: 0 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === 1) startTracking(); else stopTracking();
          },
        },
      });
    };

    (window as any).YT?.Player ? init() : ((window as any).onYouTubeIframeAPIReady = init);
    return () => { stopTracking(); playerRef.current?.destroy?.(); };
  }, [activeLesson, progress]);

  const startTracking = () => {
    stopTracking();
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getDuration) return;
      const pct = Math.round((p.getCurrentTime() / p.getDuration()) * 100);
      setWatchPct(pct);
      if (pct >= 90 && !isCompletedRef.current) {
        isCompletedRef.current = true;
        markComplete();
      }
    }, 1000);
  };

  const stopTracking = () => { clearInterval(intervalRef.current); intervalRef.current = null; };

  const markComplete = async () => {
    setIsCompleted(true);
    stopTracking();
    if (student && course && activeLesson) {
      await dataService.updateLessonProgress(student.id, course.id, activeLesson.id, 'COMPLETED', 100);
      const freshProgress = await dataService.getProgress(student.id);
      setProgress(freshProgress);

      // Gentle, dismissible nudge after a solid session — never blocks the
      // auto-advance below, just sits alongside it.
      const todayKey = new Date().toISOString().split('T')[0];
      const dismissKey = `tv_stop_nudge_dismissed_${todayKey}`;
      if (!sessionStorage.getItem(dismissKey) && shouldSuggestNaturalStop(freshProgress, quizAttempts)) {
        setShowStopBanner(true);
      }

      // Auto-advance to the next lesson — with real locking, that's now the
      // natural next step instead of leaving the student stranded on a
      // lesson marked "Completed" with nothing else to click.
      const lessons = course.lessons ?? [];
      const currentIdx = lessons.findIndex((l: any) => l.id === activeLesson.id);
      const next = lessons[currentIdx + 1];
      if (next) setActiveLesson(next);
    }
  };

  if (loading || !course) {
    return <PageSkeleton shape="rows" count={4} />;
  }

  const completedIds    = new Set(progress.filter(p => p.status === 'COMPLETED').map(p => p.lesson_id));
  const doneLessons     = course.lessons?.filter((l: any) => completedIds.has(l.id)).length ?? 0;
  const totalLessons    = course.lessons?.length ?? 0;
  const coursePercent   = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const quizUnlocked    = !totalLessons || doneLessons === totalLessons;
  // A lesson is clickable iff it's at/before the next-unlock index, or it's
  // already been completed (even out of order) — earned work never re-locks.
  const lessonUnlockIdx = course.lessons?.length ? getNextLessonUnlockIndex(course.lessons, progress) : -1;

  return (
    <div className="flex min-h-screen bg-white font-body text-neutral-900">

      {/* ── Sidebar (matches dashboard/profile/explore/notifications) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-neutral-100 py-6 px-4 gap-1 fixed left-0 top-0 h-full z-40">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-8">
          <span className="material-symbols-outlined text-orange-500" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>school</span>
          <span className="text-xl font-headline font-black text-orange-500 tracking-tight">ThalirVerse</span>
        </Link>
        {NAV_LINKS.map(({ label, href, icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={label} href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-label font-semibold transition-all ${
                isActive
                  ? 'bg-orange-50 text-orange-600 font-bold'
                  : 'text-neutral-500 hover:bg-orange-50 hover:text-orange-500'
              }`}>
              <span className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Top navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-100 h-14 flex items-center justify-between px-5 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-sm font-headline font-black text-orange-500 hidden sm:block lg:hidden">ThalirVerse</span>
            {/* Breadcrumb */}
            <nav className="hidden md:flex items-center gap-1.5 text-xs font-label">
              <Link href="/dashboard" className="text-neutral-400 hover:text-orange-500 transition-colors">My Courses</Link>
              <span className="material-symbols-outlined text-neutral-300 text-sm">chevron_right</span>
              <span className="text-neutral-400">{course.category || 'Course'}</span>
              <span className="material-symbols-outlined text-neutral-300 text-sm">chevron_right</span>
              <span className="text-orange-500 font-bold">{course.title}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">search</span>
              <input placeholder="Search lessons..." className="pl-8 pr-4 py-1.5 bg-neutral-50 border border-neutral-200 rounded-full text-xs focus:outline-none focus:border-orange-400 w-44 transition-all" />
            </div>
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-colors">
              <span className="material-symbols-outlined text-lg">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black">
              {student?.fullName?.[0] ?? '?'}
            </div>
          </div>
        </header>

        {/* Content + right panel */}
        <div className="flex flex-1 min-h-0">

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-5 min-w-0">

            {/* Lesson content */}
            {totalLessons === 0 ? (
              <div className="rounded-2xl bg-orange-50 border border-orange-100 p-10 flex flex-col items-center text-center gap-3 mb-5">
                <span className="material-symbols-outlined text-4xl text-orange-500">quiz</span>
                <h3 className="font-headline font-black text-lg">Quiz-Only Module</h3>
                <p className="text-sm text-neutral-500">Take the quiz below to earn your badge for this module.</p>
              </div>
            ) : (activeLesson?.lesson_type ?? 'VIDEO') === 'VIDEO' ? (
              <div className="rounded-3xl overflow-hidden bg-black aspect-video mb-5 relative shadow-2xl ring-1 ring-black/5 group">
                <div id="yt-frame" className="w-full h-full" />
                {isCompleted && (
                  <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>COMPLETED
                  </div>
                )}
                {watchProgress > 0 && !isCompleted && (
                  <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>WATCHING ({watchProgress}%)
                  </div>
                )}
              </div>
            ) : activeLesson?.lesson_type === 'PDF' ? (
              <div className="rounded-3xl overflow-hidden bg-neutral-100 mb-5 relative shadow-2xl ring-1 ring-black/5" style={{ aspectRatio: '3 / 4' }}>
                <iframe src={activeLesson.content_url} className="w-full h-full border-0" title={activeLesson.title} />
                {isCompleted && (
                  <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>COMPLETED
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl overflow-hidden bg-neutral-100 aspect-video mb-5 relative shadow-2xl ring-1 ring-black/5">
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeLesson.content_url)}`}
                  className="w-full h-full border-0" title={activeLesson.title} />
                {isCompleted && (
                  <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>COMPLETED
                  </div>
                )}
              </div>
            )}

            {/* Lesson title + actions */}
            {activeLesson && (
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-headline font-black text-neutral-900">{activeLesson.title}</h2>
                  <p className="text-sm text-neutral-500 mt-1">{course.title}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button className="flex items-center gap-1.5 px-4 py-2 border border-neutral-200 hover:border-orange-400 text-neutral-600 hover:text-orange-500 text-sm font-bold rounded-xl transition-all">
                    <span className="material-symbols-outlined text-sm">download</span>
                    Resources
                  </button>
                  <button
                    onClick={markComplete}
                    disabled={isCompleted}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                      isCompleted
                        ? 'bg-green-100 text-green-600 border border-green-200 cursor-default'
                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 hover:-translate-y-0.5'
                    }`}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isCompleted ? 'check_circle' : 'task_alt'}
                    </span>
                    {isCompleted ? 'Completed' : 'Complete Lesson'}
                  </button>
                </div>
              </div>
            )}

            {/* Natural stopping point — a gentle, dismissible nudge, never
                a lock. Sits alongside the normal flow, doesn't replace it. */}
            {showStopBanner && (
              <div className="flex items-start gap-3 mb-5 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-800">
                <span className="material-symbols-outlined text-green-500 shrink-0">self_improvement</span>
                <p className="text-sm flex-1">
                  Great session today! You&rsquo;ve completed a couple of things &mdash; that&rsquo;s a solid pace.
                  It&rsquo;s a good time to take a break; come back tomorrow to keep going.
                </p>
                <button
                  onClick={() => {
                    const todayKey = new Date().toISOString().split('T')[0];
                    sessionStorage.setItem(`tv_stop_nudge_dismissed_${todayKey}`, '1');
                    setShowStopBanner(false);
                  }}
                  className="text-green-500 hover:text-green-700 shrink-0">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-neutral-100 flex gap-6 mb-5">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-label font-semibold transition-all border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'text-orange-500 border-orange-500'
                      : 'text-neutral-400 border-transparent hover:text-neutral-600'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'Overview' && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {course.description || 'No description available for this module.'}
                </p>
                {course.category && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-[10px] font-label font-black px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full uppercase tracking-wider">
                      {course.category}
                    </span>
                  </div>
                )}
              </div>
            )}
            {activeTab !== 'Overview' && (
              <div className="py-8 text-center text-neutral-400">
                <span className="material-symbols-outlined text-4xl mb-2 block">construction</span>
                <p className="text-sm font-medium">{activeTab} coming soon.</p>
              </div>
            )}
          </div>

          {/* ── Right "Course Content" panel ───────────────────── */}
          <div className="hidden lg:flex flex-col w-72 xl:w-80 border-l border-neutral-100 bg-white shrink-0 overflow-y-auto">
            <div className="px-5 py-4 border-b border-neutral-100 shrink-0">
              <h3 className="font-headline font-bold text-base text-neutral-900">Course Content</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${coursePercent}%` }} />
                </div>
                <span className="text-xs font-label font-bold text-orange-500 shrink-0">{coursePercent}% Complete</span>
              </div>
            </div>

            <StaggerGrid className="flex-1 py-3 px-3 space-y-1">
              {course.lessons?.map((lesson: any, i: number) => {
                const done      = completedIds.has(lesson.id);
                const active    = activeLesson?.id === lesson.id;
                const unlocked  = done || i <= lessonUnlockIdx;
                return (
                  <StaggerItem key={lesson.id}>
                  <button
                    onClick={() => { if (!unlocked) return; setActiveLesson(lesson); isCompletedRef.current = done; setIsCompleted(done); }}
                    disabled={!unlocked}
                    className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl transition-all group ${
                      active   ? 'bg-white border-2 border-orange-500 shadow-lg shadow-orange-500/10' :
                      done     ? 'bg-orange-50/50 border border-orange-100 hover:shadow-md'           :
                      unlocked ? 'bg-neutral-50 border border-neutral-100 hover:shadow-md'            :
                                 'bg-neutral-50 border border-neutral-100 opacity-60 cursor-not-allowed'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      done   ? 'bg-orange-100 text-orange-600' :
                      active ? 'bg-orange-500 text-white'      :
                               'bg-neutral-200 text-neutral-400'
                    }`}>
                      {done
                        ? <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        : active
                          ? <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                          : !unlocked
                            ? <span className="material-symbols-outlined text-sm">lock</span>
                            : <span className="text-[10px] font-black">{(i + 1).toString().padStart(2, '0')}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold leading-snug truncate ${active ? 'text-orange-600' : 'text-neutral-700'}`}>
                        {String(i + 1).padStart(2, '0')}. {lesson.title}
                      </p>
                      <p className={`text-[10px] mt-0.5 font-label ${
                        active ? 'text-orange-400' : done ? 'text-green-500' : 'text-neutral-400'
                      }`}>
                        {active ? 'Currently Playing' : done ? 'Completed' : unlocked ? 'Ready' : 'Locked'}
                      </p>
                    </div>
                  </button>
                  </StaggerItem>
                );
              })}

              {/* Quiz row */}
              {course.quiz && (
                <div className={`flex items-start gap-3 px-3 py-3 rounded-xl mt-1 ${
                  quizUnlocked ? 'bg-orange-50 border border-orange-200' : 'opacity-50'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    quizUnlocked ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-700 truncate">Module Quiz</p>
                    <p className="text-[10px] text-neutral-400 font-label">
                      {quizUnlocked ? 'Ready to take' : `Unlock after Lesson ${totalLessons}`}
                    </p>
                  </div>
                  {quizUnlocked && (
                    <Link href={`/quiz/${course.id}`}
                      className="shrink-0 text-orange-500 hover:text-orange-600">
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </Link>
                  )}
                </div>
              )}
            </StaggerGrid>

            {/* Ask a question */}
            <div className="px-4 py-4 border-t border-neutral-100 shrink-0">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-neutral-200 hover:border-orange-400 hover:text-orange-500 text-sm font-bold text-neutral-500 rounded-xl transition-all">
                <span className="material-symbols-outlined text-sm">chat_bubble</span>
                Ask a Question
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
