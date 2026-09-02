'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

// Biggest-weight celebration, reserved for crossing a 25/50/75/100% overall
// milestone — a rocket launches bottom-to-top with exhaust particles. The
// 100% (graduation) tier gets a visibly bigger two-burst confetti than the
// routine 80-particle quiz-pass burst, so graduation reads as the biggest
// moment in the app, not just another badge.
export default function CelebrationRocket({ show, onDone, tier, label }: { show: boolean; onDone: () => void; tier: number; label: string }) {
  const isGraduation = tier >= 100;

  useEffect(() => {
    if (!show) return;
    const burst = (particleCount: number, spread: number) => confetti({
      particleCount, spread, startVelocity: 55, origin: { y: 0.7 },
      colors: ['#f97316', '#fb923c', '#fbbf24', '#22c55e', '#3b82f6'],
      disableForReducedMotion: true,
    });
    burst(isGraduation ? 140 : 70, 80);
    let secondBurst: ReturnType<typeof setTimeout> | undefined;
    if (isGraduation) secondBurst = setTimeout(() => burst(140, 100), 350);
    const t = setTimeout(onDone, 2800);
    return () => { clearTimeout(t); if (secondBurst) clearTimeout(secondBurst); };
  }, [show, onDone, isGraduation]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="relative w-48 h-64 flex items-end justify-center overflow-hidden">
            {/* Exhaust particles */}
            {[...Array(8)].map((_, i) => (
              <motion.span key={i}
                className="absolute bottom-8 w-2 h-2 rounded-full bg-orange-300"
                initial={{ opacity: 0, x: (i - 4) * 6, y: 0 }}
                animate={{ opacity: [0, 1, 0], x: (i - 4) * 14, y: 60 }}
                transition={{ duration: 1.4, delay: 0.3 + i * 0.05, repeat: 1, ease: 'easeOut' }} />
            ))}

            {/* Rocket */}
            <motion.span
              className="material-symbols-outlined text-orange-500 absolute bottom-8"
              style={{ fontSize: 56, fontVariationSettings: "'FILL' 1" }}
              initial={{ y: 0, rotate: 0 }}
              animate={{ y: -280, rotate: [0, -4, 4, 0] }}
              transition={{ duration: 1.6, delay: 0.4, ease: [0.3, 0, 0.4, 1] }}>
              rocket_launch
            </motion.span>
          </div>

          <motion.div
            className="absolute bottom-1/4 text-center bg-white rounded-3xl shadow-2xl px-8 py-6 max-w-xs"
            initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.8, type: 'spring', stiffness: 260, damping: 18 }}>
            <p className="text-3xl font-headline font-black text-orange-500">{tier}%</p>
            <p className="text-sm font-bold text-neutral-700 mt-1">{label}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
