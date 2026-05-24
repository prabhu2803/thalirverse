'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function QuizResults({ params }: { params: { id: string } }) {
  const [confetti, setConfetti] = useState<{ id: number; left: string; top: string; delay: string; duration: string; color: string; rotate: string; scale: string; isCircle: boolean }[]>([]);

  useEffect(() => {
    // Generate random confetti
    const colors = ['#f97316', '#3b82f6', '#22c55e', '#eab308'];
    const newConfetti = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${Math.random() * 2 + 3}s`,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: `${Math.random() * 360}deg`,
      scale: `${Math.random() * 0.5 + 0.5}`,
      isCircle: Math.random() > 0.5,
    }));
    setConfetti(newConfetti);
  }, []);

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen font-body text-neutral-900 dark:text-neutral-100 overflow-x-hidden">
      {/* TopAppBar */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 fixed top-0 left-0 w-full z-50 h-16 flex justify-between items-center px-4">
        <Link href={`/courses/${params.id}`} className="text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-95 transition-transform duration-200 p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">close</span>
        </Link>
        <h1 className="font-display font-black text-orange-600 tracking-tight text-lg">ThalirVerse Quiz</h1>
        <div className="flex items-center gap-1 text-orange-600 font-bold">
          <span className="material-symbols-outlined">timer</span>
          <span className="text-sm font-label uppercase">5:24</span>
        </div>
      </header>

      <main className="pt-24 pb-40 px-4 max-w-md mx-auto relative min-h-screen flex flex-col justify-center">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute animate-bounce opacity-40"
              style={{
                left: c.left,
                top: c.top,
                backgroundColor: c.color,
                width: '10px',
                height: '10px',
                borderRadius: c.isCircle ? '50%' : '2px',
                transform: `rotate(${c.rotate}) scale(${c.scale})`,
                animationDelay: c.delay,
                animationDuration: c.duration,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full">
          {/* Success Header */}
          <div className="text-center mb-8 relative">
            <div className="mb-6 inline-block animate-[float_4s_ease-in-out_infinite]">
              <div className="relative">
                <img 
                  alt="Success Badge" 
                  className="w-32 h-32 mx-auto drop-shadow-2xl" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDB_O35Zra24HyrevJPwZlsxzfZvUVLMSFXPUHtAXkKt5R26IFKORy95_GXkS_6PAaeOpbX-akiMvYHU5J2sRPj_NP6N6AT0nuUAQ9zZCMcDxHJOFRaIECCgrOZTlSsB3iruuTfBh6i58iSspmd5GVoHUTUu4DX0digmMJTdAWA6Z64aG5dOAqON36r8BApe6QyToED4qHXx3qQN9r10pmN6cHBUW6XNeT79QVdaNYX2zsRmce7D82BtgFYBUqWhdoUVKXYeV9rsY"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-neutral-900 uppercase tracking-widest">
                  PASS
                </div>
              </div>
            </div>
            <h2 className="font-headline text-3xl font-black text-orange-600 leading-tight mb-2">Congratulations!</h2>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">You crushed this lesson!</p>
          </div>

          {/* Bento Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Score Card */}
            <div className="col-span-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-3xl p-6 text-center border border-orange-100 dark:border-orange-900/30 shadow-xl shadow-orange-500/5">
              <div className="text-sm font-label font-bold text-neutral-400 uppercase tracking-widest mb-1">Final Score</div>
              <div className="flex justify-center items-baseline gap-2">
                <span className="text-5xl font-black text-neutral-900 dark:text-white">80</span>
                <span className="text-2xl font-bold text-orange-600">%</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-2 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-600 rounded-full transition-all duration-1000 ease-out" style={{ width: '80%' }}></div>
                </div>
                <span className="text-xs font-bold font-label text-orange-600">8/10 Correct</span>
              </div>
            </div>

            {/* Time Stats */}
            <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-neutral-100 dark:border-neutral-800 shadow-sm">
              <span className="material-symbols-outlined text-orange-600 mb-2">schedule</span>
              <span className="text-xs font-label font-bold text-neutral-400 uppercase tracking-tighter">Time Taken</span>
              <span className="text-lg font-bold text-neutral-800 dark:text-neutral-200">5:24</span>
            </div>

            {/* XP Stats */}
            <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-neutral-100 dark:border-neutral-800 shadow-sm">
              <span className="material-symbols-outlined text-orange-600 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
              <span className="text-xs font-label font-bold text-neutral-400 uppercase tracking-tighter">XP Earned</span>
              <span className="text-lg font-bold text-green-600">+50 XP</span>
            </div>
          </div>

          {/* Achievement Preview */}
          <div className="bg-orange-600 rounded-3xl p-5 flex items-center gap-4 text-white shadow-lg shadow-orange-600/20 mb-8 cursor-pointer hover:scale-[1.02] transition-transform">
            <div className="bg-orange-500 rounded-2xl p-3">
              <span className="material-symbols-outlined text-3xl">rocket_launch</span>
            </div>
            <div>
              <h4 className="font-bold text-sm">Level Up Progress</h4>
              <p className="text-xs text-orange-100">Only 120 XP left to Level 13!</p>
            </div>
            <div className="ml-auto">
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Shell */}
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 px-4 pb-8 pt-4 flex flex-col gap-3">
        <Link href={`/courses/${params.id}`} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20">
          <span>Continue to Next Lesson</span>
          <span className="material-symbols-outlined text-xl">arrow_forward_ios</span>
        </Link>
        <button className="w-full bg-transparent border-2 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold py-4 rounded-2xl active:scale-[0.98] transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800">
          Review Answers
        </button>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}} />
    </div>
  );
}
