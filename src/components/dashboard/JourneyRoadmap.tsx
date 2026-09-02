'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  moduleTheme, isModuleComplete, isModuleUnlocked, getModuleProgress,
  ModuleLike, ProgressRow, QuizAttemptRow,
} from '@/lib/gamification';
import { springBouncy, springSnappy } from '@/lib/motion';
import CelebrationArrow from '@/components/motion/CelebrationArrow';

interface JourneyRoadmapProps {
  modules: ModuleLike[];
  progress: ProgressRow[];
  quizAttempts: QuizAttemptRow[];
}

export default function JourneyRoadmap({ modules, progress, quizAttempts }: JourneyRoadmapProps) {
  const sorted = [...modules].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const nodes = sorted.map(m => ({
    module: m,
    complete: isModuleComplete(m, progress, quizAttempts),
    unlocked: isModuleUnlocked(m, sorted, progress, quizAttempts),
    prog: getModuleProgress(m, progress, quizAttempts),
  }));
  const currentIdx = nodes.findIndex(n => n.unlocked && !n.complete);

  // One-time-per-module celebration, gated by localStorage so it only ever
  // fires again for a module that's genuinely newly complete, never on a
  // routine revisit to the dashboard.
  const [celebrating, setCelebrating] = useState<{ id: string; title: string } | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || celebrating) return;
    const newlyComplete = nodes.find(n => n.complete && !localStorage.getItem(`tv_module_celebrated_${n.module.id}`));
    if (newlyComplete) {
      setCelebrating({ id: newlyComplete.module.id, title: newlyComplete.module.badge_title || newlyComplete.module.title });
    }
  }, [celebrating, nodes]);
  const handleCelebrationDone = () => {
    if (celebrating) localStorage.setItem(`tv_module_celebrated_${celebrating.id}`, '1');
    setCelebrating(null);
  };

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-neutral-100 shadow-sm text-neutral-400">
        <span className="material-symbols-outlined text-4xl mb-3">route</span>
        <p className="text-sm font-bold">No courses yet</p>
        <p className="text-xs mt-1">Your journey map will appear here once courses are published.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-2xl font-black font-headline tracking-tight">Your Journey</h3>
          <p className="text-sm text-neutral-500 mt-0.5">Complete each module in order to unlock the next.</p>
        </div>
        <Link href="/profile" className="text-orange-500 font-bold text-sm flex items-center gap-1 hover:underline shrink-0">
          View All <span className="material-symbols-outlined">chevron_right</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start gap-0">
        {nodes.map((n, i) => {
          const theme = moduleTheme(n.module.id);
          const isCurrent = i === currentIdx;
          const status: 'complete' | 'current' | 'locked' = n.complete ? 'complete' : isCurrent ? 'current' : 'locked';

          // Each node lands a beat after the previous one, so the roadmap
          // visibly draws itself left-to-right (top-to-bottom on mobile)
          // instead of popping in all at once.
          const nodeDelay = i * 0.15;

          const circle = (
            <div className="relative shrink-0">
              {status === 'current' && (
                <motion.span
                  className={`absolute -inset-1.5 rounded-full ${theme.soft.ring} ring-2`}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: nodeDelay + 0.4 }}
                />
              )}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...springBouncy, delay: nodeDelay }}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
                  status === 'complete' ? `bg-gradient-to-br ${theme.strong.from} ${theme.strong.to} shadow-md` :
                  status === 'current'  ? `${theme.soft.bg} ring-4 ${theme.soft.ring}` :
                                           'bg-neutral-100'
                }`}>
                <motion.span
                  initial={status === 'complete' ? { scale: 0, rotate: -45 } : false}
                  animate={status === 'complete' ? { scale: 1, rotate: 0 } : {}}
                  transition={{ ...springBouncy, delay: nodeDelay + 0.35 }}
                  className={`material-symbols-outlined ${
                    status === 'complete' ? 'text-white' :
                    status === 'current'  ? theme.soft.icon :
                                             'text-neutral-300'
                  }`}
                  style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>
                  {status === 'complete' ? 'check' : status === 'locked' ? 'lock' : theme.icon}
                </motion.span>
              </motion.div>
            </div>
          );

          const label = (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...springSnappy, delay: nodeDelay + 0.1 }}
              className="text-center md:text-left mt-3 md:mt-0 md:ml-3 max-w-[9rem]">
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                status === 'complete' ? 'bg-green-50 text-green-600' :
                status === 'current'  ? theme.tagClass :
                                         'bg-neutral-100 text-neutral-400'
              }`}>
                {status === 'complete' ? 'Completed' : status === 'current' ? `${n.prog.percent}% Done` : 'Locked'}
              </span>
              <p className="font-bold text-sm mt-1.5 leading-tight">{n.module.title}</p>
            </motion.div>
          );

          return (
            <div key={n.module.id} className="flex flex-col md:flex-row md:flex-1 md:last:flex-none">
              {/* Node + label */}
              <div className="flex flex-col md:flex-row items-center md:items-start shrink-0">
                {status === 'locked' ? (
                  <div className="flex flex-col md:flex-row items-center md:items-start opacity-70 cursor-not-allowed">
                    {circle}{label}
                  </div>
                ) : (
                  <Link href={`/courses/${n.module.id}`} className="flex flex-col md:flex-row items-center md:items-start group">
                    <motion.div whileHover={{ y: -4, scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={springSnappy}
                      className="flex flex-col md:flex-row items-center md:items-start">
                      {circle}{label}
                    </motion.div>
                  </Link>
                )}
              </div>

              {/* Connector to next node */}
              {i < nodes.length - 1 && (
                <>
                  {/* Desktop: horizontal */}
                  <div className="hidden md:block flex-1 h-1.5 rounded-full mx-2 mt-8 bg-neutral-100 relative overflow-hidden">
                    <motion.div className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${theme.strong.from} ${theme.strong.to}`}
                      initial={{ width: 0 }} animate={{ width: n.complete ? '100%' : '0%' }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: nodeDelay + 0.3 }} />
                  </div>
                  {/* Mobile: vertical */}
                  <div className="md:hidden w-1.5 h-8 rounded-full my-2 mx-auto bg-neutral-100 relative overflow-hidden">
                    <motion.div className={`absolute inset-x-0 top-0 rounded-full bg-gradient-to-b ${theme.strong.from} ${theme.strong.to}`}
                      initial={{ height: 0 }} animate={{ height: n.complete ? '100%' : '0%' }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: nodeDelay + 0.3 }} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <CelebrationArrow
        show={!!celebrating}
        onDone={handleCelebrationDone}
        label={celebrating ? `${celebrating.title} Earned!` : undefined}
      />
    </div>
  );
}
