'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUp, staggerContainer } from '@/lib/motion';

// Wraps a card grid so its children cascade in on mount instead of
// appearing all at once. Cap children at ~12 staggered items for very
// long lists — pass a plain (non-staggered) container for anything larger.
export function StaggerGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial="hidden" animate="visible" variants={staggerContainer}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}
