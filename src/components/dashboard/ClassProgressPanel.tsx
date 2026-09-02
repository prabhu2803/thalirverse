'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { dataService } from '@/lib/supabaseClient';
import { fadeUp } from '@/lib/motion';
import CelebrationArrow from '@/components/motion/CelebrationArrow';

type ClassProgress = Awaited<ReturnType<typeof dataService.getClassProgress>>;

// A truthful, non-comparative signal about a real group the student
// belongs to — never a ranking, never a name, never a score. Deliberately
// distinct from the school leaderboard: this only ever shows aggregate
// counts, so there's nothing here to feel behind on.
export default function ClassProgressPanel({ student }: { student: { school: string; standard: string } }) {
  const [cp, setCp] = useState<ClassProgress>(null);
  const [loading, setLoading] = useState(true);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    (async () => {
      setCp(await dataService.getClassProgress());
      setLoading(false);
    })();
  }, []);

  // One-time-per-milestone celebration, gated by localStorage — a shared/
  // observed event, not a personal achievement record, so it doesn't need
  // server-side persistence the way a personal badge or XP milestone does.
  useEffect(() => {
    if (!cp || cp.class_size < 2 || cp.milestone_tier <= 0) return;
    const key = `tv_class_milestone_seen_${student.school}_${student.standard}_${cp.milestone_tier}`
      .replace(/\s+/g, '-').toLowerCase();
    if (typeof window === 'undefined' || localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setCelebrating(true);
  }, [cp, student]);

  if (loading) {
    return (
      <motion.div variants={fadeUp} className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
        <div className="h-5 w-28 bg-neutral-100 rounded-full animate-pulse mb-4" />
        <div className="h-4 w-full bg-neutral-100 rounded-full animate-pulse mb-2" />
        <div className="h-2 w-full bg-neutral-100 rounded-full animate-pulse" />
      </motion.div>
    );
  }

  const hasClass = cp && cp.class_size >= 2;

  return (
    <motion.div variants={fadeUp} className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
      <h3 className="font-bold font-headline text-xl flex items-center gap-3 mb-5">
        <span className="material-symbols-outlined text-sky-600" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
        Your Class
      </h3>

      {hasClass ? (
        <>
          <p className="text-sm text-neutral-700 mb-3">
            <span className="font-bold text-sky-700">{cp!.students_active}</span> of{' '}
            <span className="font-bold">{cp!.class_size}</span> classmates in {cp!.standard} are on this journey with you.
          </p>
          <div className="h-2 bg-sky-50 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-sky-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.round((cp!.students_active / cp!.class_size) * 100)}%` }} />
          </div>
          <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-2xl border border-sky-100">
            <span className="material-symbols-outlined text-sky-600 text-xl">auto_stories</span>
            <div>
              <p className="text-[10px] font-label font-bold text-sky-500 uppercase tracking-wider">Together, so far</p>
              <p className="text-sm font-bold text-neutral-800">
                {cp!.collective_completions} lessons &amp; quizzes completed
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <span className="material-symbols-outlined text-3xl text-sky-300">groups</span>
          <p className="text-xs text-neutral-400 mt-2 font-medium">
            Once classmates in your batch join, you&rsquo;ll see your class&rsquo;s progress here.
          </p>
        </div>
      )}

      <CelebrationArrow
        show={celebrating}
        onDone={() => setCelebrating(false)}
        label={cp ? `Your class just crossed ${cp.milestone_tier} completions together! 🎉` : undefined}
      />
    </motion.div>
  );
}
