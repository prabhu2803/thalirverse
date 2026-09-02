'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { scaleIn } from '@/lib/motion';

const STORAGE_KEY = 'tv_onboarding_seen_v1';

const FEATURES = [
  { icon: 'bolt',                  color: 'text-orange-500 bg-orange-50',  title: 'Earn XP', body: 'Pass quizzes to earn XP — with a chance at a bonus roll for extra XP each time.' },
  { icon: 'local_fire_department', color: 'text-red-500 bg-red-50',        title: 'Build a Streak', body: 'Complete a lesson every day to grow your streak. Miss a day and it resets — so keep it alive!' },
  { icon: 'military_tech',         color: 'text-purple-600 bg-purple-50',  title: 'Collect Badges', body: 'Finish a module to earn its badge, visible on your Achievements page forever.' },
  { icon: 'route',                 color: 'text-blue-600 bg-blue-50',      title: 'Follow Your Journey', body: 'Modules unlock in order — finish one to open the next on your roadmap.' },
];

// Single dismissible onboarding card, shown once per browser via a
// localStorage flag (versioned so a future redesign can force a re-show).
export default function OnboardingModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="hidden"
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-neutral-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20 mb-4">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
              <h2 className="text-xl font-headline font-black text-neutral-900">Welcome to ThalirVerse!</h2>
              <p className="text-sm text-neutral-500 mt-1">Here's how learning works here.</p>
            </div>

            <div className="space-y-4 mb-6">
              {FEATURES.map(f => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-800">{f.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={dismiss}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-orange-500/20">
              Let's Get Started
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
