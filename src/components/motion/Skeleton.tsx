'use client';

import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';

// Base shimmer block — a translating gradient overlay, transform/opacity
// only so it stays cheap on low-end devices. Replaces the old "⏳ spinning
// emoji" loading state used across the app.
export function SkeletonBlock({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={`relative overflow-hidden bg-neutral-100 ${className}`} style={style}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export function SkeletonCircle({ size = 64 }: { size?: number }) {
  return <SkeletonBlock className="rounded-full" style={{ width: size, height: size }} />;
}

// A card-shaped placeholder — image header + a couple of text lines.
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
      <SkeletonBlock className="h-40 w-full" />
      <div className="p-5 space-y-3">
        <SkeletonBlock className="h-3 w-1/3 rounded-full" />
        <SkeletonBlock className="h-4 w-3/4 rounded-full" />
        <SkeletonBlock className="h-3 w-full rounded-full" />
      </div>
    </div>
  );
}

// A list-row placeholder — avatar + a couple of text lines, for table/list pages.
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4">
      <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-3 w-1/3 rounded-full" />
        <SkeletonBlock className="h-3 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

// A generic page-loading state: a few staggered cards or rows, used in
// place of the old spinning-emoji block. `shape` picks the composition.
export function PageSkeleton({ shape = 'cards', count = 4 }: { shape?: 'cards' | 'rows'; count?: number }) {
  return (
    <div className="min-h-screen bg-white p-8">
      <SkeletonBlock className="h-8 w-48 rounded-full mb-8" />
      {shape === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-neutral-100 divide-y divide-neutral-100">
          {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}
    </div>
  );
}
