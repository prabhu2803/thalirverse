'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function CourseView({ params }: { params: { id: string } }) {
  useEffect(() => {
    // Micro-interaction for the "Continue" FAB could be handled by Framer Motion, 
    // but for now we'll stick to simple Tailwind classes and standard React.
  }, []);

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 font-body text-neutral-900 dark:text-neutral-100 min-h-screen">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 h-16 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="active:scale-95 transition-transform p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-orange-500">arrow_back</span>
          </Link>
          <h1 className="font-display text-lg font-black text-orange-500">ThalirVerse</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="active:scale-95 transition-transform p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full">
            <span className="material-symbols-outlined text-neutral-500">more_vert</span>
          </button>
        </div>
      </header>

      <main className="pt-20 pb-24 px-4 max-w-4xl mx-auto">
        {/* Header Section */}
        <section className="mb-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-headline text-2xl font-bold">Entrepreneurship 101</h2>
            <p className="text-neutral-500 text-sm md:text-base leading-relaxed">Learn to turn your ideas into a real business.</p>
            
            {/* Progress bar container */}
            <div className="mt-4 bg-neutral-200 dark:bg-neutral-800 rounded-full h-3 overflow-hidden border border-neutral-300 dark:border-neutral-700">
              <div className="bg-orange-500 h-full rounded-full transition-all duration-700 ease-out" style={{ width: '45%' }}></div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="font-label text-xs font-bold text-orange-500">45% Completed</span>
              <span className="font-label text-xs font-medium text-neutral-500">Lesson 2 of 4</span>
            </div>
          </div>
        </section>

        {/* Video Player Module */}
        <section className="mb-8 overflow-hidden rounded-xl bg-black aspect-video relative group shadow-xl">
          <img 
            className="w-full h-full object-cover opacity-80" 
            alt="Startup Office" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu__bbOoTpkGs4WNSurK7Z3XKsV1THhuLFDkT8HYK9AZoG7zm3rTaHMj-MWPqCYReEx0hJStfD8d1OoqBCzSAfUmsw8tx3cjBg4A5oNR8fqCIzWzmEDsO6OsvcPqrEN2x3OC7fvc61k_8-0Yo-vleLGLqkflkdX5NnJVmn9qz6_d3pB18xLHp_E-b8W-IMRvVEj4Jv0Pmu9wuLCv98DSW5ajPpV6fsD1DKXusCBp2yRplp_dh9GvnNn-J9aSPnwal0Li0tOGYdDtc"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-20 h-20 bg-orange-500/90 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all duration-300 group-hover:bg-orange-500">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </button>
          </div>
          
          {/* Video Controls Placeholder */}
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black/80 to-transparent flex items-center px-4 justify-between text-white/90">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-sm">play_circle</span>
              <div className="w-32 h-1 bg-white/30 rounded-full">
                <div className="bg-orange-500 h-full w-1/3 rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-sm">settings</span>
              <span className="material-symbols-outlined text-sm">fullscreen</span>
            </div>
          </div>
        </section>

        {/* Activity Checklist */}
        <section className="space-y-3">
          <h3 className="font-headline text-lg font-bold px-1">Curriculum</h3>
          
          {/* Item 1: Completed */}
          <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-green-500/10 text-green-500 rounded-full">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>check_circle</span>
            </div>
            <div className="flex-grow">
              <h4 className="font-headline text-sm font-bold">Introduction to Startups</h4>
              <div className="flex items-center gap-2 mt-0.5 text-neutral-500">
                <span className="material-symbols-outlined text-xs">video_library</span>
                <span className="font-label text-xs">5:20 min</span>
              </div>
            </div>
            <span className="font-label text-xs font-bold text-green-500">COMPLETED</span>
          </div>

          {/* Item 2: Current/Unlocked */}
          <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-500/30 ring-2 ring-orange-500/10">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-orange-500 text-white rounded-full">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div className="flex-grow">
              <h4 className="font-headline text-sm font-bold text-orange-900 dark:text-orange-100">Market Research Basics</h4>
              <div className="flex items-center gap-2 mt-0.5 text-orange-700 dark:text-orange-300">
                <span className="material-symbols-outlined text-xs">article</span>
                <span className="font-label text-xs">12 Page PDF</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-orange-500 px-3 py-1 rounded-full text-white">
              <span className="font-label text-xs font-bold uppercase tracking-wider">Learning</span>
            </div>
          </div>

          {/* Item 3: Locked */}
          <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-full">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <div className="flex-grow">
              <h4 className="font-headline text-sm font-bold">Customer Discovery</h4>
              <div className="flex items-center gap-2 mt-0.5 text-neutral-500">
                <span className="material-symbols-outlined text-xs">video_library</span>
                <span className="font-label text-xs">8:45 min</span>
              </div>
            </div>
          </div>

          {/* Item 4: Locked Quiz */}
          <Link href={`/quiz/${params.id}`} className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-orange-500/50 transition-colors group">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:text-orange-500 rounded-full transition-colors">
              <span className="material-symbols-outlined">quiz</span>
            </div>
            <div className="flex-grow">
              <h4 className="font-headline text-sm font-bold group-hover:text-orange-500 transition-colors">Final Module Quiz</h4>
              <div className="flex items-center gap-2 mt-0.5 text-neutral-500">
                <span className="material-symbols-outlined text-xs">quiz</span>
                <span className="font-label text-xs">15 Questions</span>
              </div>
            </div>
          </Link>
        </section>
      </main>

      {/* FAB: Continue */}
      <div className="fixed bottom-8 right-6 z-40">
        <button className="bg-orange-500 text-white shadow-[0_10px_25px_-5px_rgba(249,115,22,0.5)] rounded-full px-6 py-4 flex items-center gap-3 active:scale-95 transition-all hover:bg-orange-600">
          <span className="font-label font-bold text-sm uppercase tracking-widest">Continue</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
