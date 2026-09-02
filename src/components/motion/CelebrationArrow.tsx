'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

// Medium-weight celebration for a single module completion: an arrow arcs
// into a bullseye with a modest confetti burst. Bigger moments (crossing a
// 25/50/75/100% milestone) get CelebrationRocket instead — this one stays
// deliberately smaller so graduation still reads as the biggest beat.
export default function CelebrationArrow({ show, onDone, label }: { show: boolean; onDone: () => void; label?: string }) {
  useEffect(() => {
    if (!show) return;
    confetti({
      particleCount: 40,
      spread: 55,
      startVelocity: 35,
      origin: { y: 0.5 },
      colors: ['#f97316', '#fb923c', '#22c55e'],
      disableForReducedMotion: true,
    });
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="relative w-40 h-40">
            {/* Bullseye */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center"
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9, type: 'spring', stiffness: 300, damping: 18 }}>
              <div className="w-24 h-24 rounded-full bg-orange-300 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-orange-500" />
              </div>
            </motion.div>

            {/* Arrow */}
            <motion.span
              className="material-symbols-outlined absolute text-orange-600"
              style={{ fontSize: 40, fontVariationSettings: "'FILL' 1", left: -160, top: 60 }}
              initial={{ x: 0, y: 0, rotate: -35, opacity: 1 }}
              animate={{ x: 200, y: -10, rotate: 0, opacity: [1, 1, 0] }}
              transition={{ duration: 0.9, ease: [0.3, 0, 0.6, 1] }}>
              arrow_upward
            </motion.span>
          </div>

          {label && (
            <motion.p
              className="absolute bottom-1/3 text-lg font-headline font-black text-orange-600 bg-white/90 px-5 py-2 rounded-full shadow-lg"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
              {label}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
