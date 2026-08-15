'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUp } from '@/lib/motion';

// Viewport-triggered fade-up — wrap any section so it animates in once as
// the user scrolls to it, instead of appearing instantly on page load.
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  );
}
