'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { springBouncy, springSoft } from '@/lib/motion';

// Validated pair (dataviz skill, --mode light): worst adjacent CVD ΔE 26.5,
// normal-vision ΔE 34.8, both >= 3:1 contrast. Orange is this app's own
// --color-orange-600 token; blue already appears on this page (Total
// Students stat card) — no new colors introduced.
const SERIES = {
  lessons: { key: 'lessons', label: 'Lessons Completed', color: '#ea580c', dot: 'bg-orange-600' },
  quizzes: { key: 'quizzes', label: 'Quiz Attempts', color: '#2a78d6', dot: 'bg-blue-600' },
} as const;

const DAYS = 30;
const WIDTH = 700;
const HEIGHT = 220;
const PAD_TOP = 20;
const PAD_BOTTOM = 8;
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Smooth midpoint-bezier curve — organic rather than sharp straight segments,
// matching the app's rounded visual language.
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export default function ActivityTrendChart({ progress, quizAttempts }: { progress: any[]; quizAttempts: any[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gradientId = useId();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (DAYS - 1 - i));
      return d;
    });
  }, []);

  const series = useMemo(() => {
    const lessonCounts: Record<string, number> = {};
    progress.forEach(p => {
      if (p.status !== 'COMPLETED' || !p.completed_at) return;
      const k = dateKey(new Date(p.completed_at));
      lessonCounts[k] = (lessonCounts[k] ?? 0) + 1;
    });
    const quizCounts: Record<string, number> = {};
    quizAttempts.forEach(a => {
      if (!a.attempted_at) return;
      const k = dateKey(new Date(a.attempted_at));
      quizCounts[k] = (quizCounts[k] ?? 0) + 1;
    });
    return days.map(d => {
      const k = dateKey(d);
      return { date: d, lessons: lessonCounts[k] ?? 0, quizzes: quizCounts[k] ?? 0 };
    });
  }, [days, progress, quizAttempts]);

  const maxVal = Math.max(1, ...series.map(s => Math.max(s.lessons, s.quizzes)));
  const xFor = (i: number) => (i / (DAYS - 1)) * WIDTH;
  const yFor = (v: number) => PAD_TOP + PLOT_HEIGHT - (v / maxVal) * PLOT_HEIGHT;

  const pointsFor = (key: 'lessons' | 'quizzes') => series.map((s, i) => ({ x: xFor(i), y: yFor(s[key]) }));
  const linePath = (key: 'lessons' | 'quizzes') => smoothPath(pointsFor(key));
  const areaPath = (key: 'lessons' | 'quizzes') =>
    `${linePath(key)} L ${xFor(DAYS - 1)} ${yFor(0)} L ${xFor(0)} ${yFor(0)} Z`;

  const totalActivity = series.reduce((sum, s) => sum + s.lessons + s.quizzes, 0);

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.round((relX / WIDTH) * (DAYS - 1));
    setHoverIdx(Math.max(0, Math.min(DAYS - 1, idx)));
  };

  const hovered = hoverIdx !== null ? series[hoverIdx] : null;
  const hoverPct = hoverIdx !== null ? (xFor(hoverIdx) / WIDTH) * 100 : 0;
  const flipLeft = hoverPct > 62; // keep the ~180px-wide tooltip from overflowing the card

  if (totalActivity === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100">
        <div className="mb-2">
          <h5 className="text-xl font-bold text-neutral-900">Activity Trend</h5>
          <p className="text-sm text-neutral-500">Last {DAYS} days</p>
        </div>
        <p className="text-sm text-neutral-400 py-10 text-center">No activity recorded in the last {DAYS} days yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h5 className="text-xl font-bold text-neutral-900">Activity Trend</h5>
          <p className="text-sm text-neutral-500">Lessons completed & quiz attempts, last {DAYS} days</p>
        </div>
        {/* Legend — same pill style as the Student Status donut legend */}
        <div className="flex items-center gap-2">
          {Object.values(SERIES).map(s => (
            <div key={s.key} className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-full">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs font-bold text-neutral-600">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative bg-neutral-50/60 rounded-[1.75rem] p-4 pb-0">
        <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto touch-none"
          onPointerMove={handleMove} onPointerLeave={() => setHoverIdx(null)}>
          <defs>
            <linearGradient id={`${gradientId}-lessons`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES.lessons.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={SERIES.lessons.color} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${gradientId}-quizzes`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES.quizzes.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={SERIES.quizzes.color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Baseline only — no gridline clutter, matches the bar chart's minimal axis */}
          <line x1={0} x2={WIDTH} y1={yFor(0)} y2={yFor(0)} stroke="#e5e5e2" strokeWidth={1} />

          {/* Area fills — bold gradient wash, fades in after the lines draw */}
          <motion.path d={areaPath('quizzes')} fill={`url(#${gradientId}-quizzes)`} stroke="none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }} />
          <motion.path d={areaPath('lessons')} fill={`url(#${gradientId}-lessons)`} stroke="none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }} />

          {/* Lines — bold 3px, smooth curves, draw in via pathLength */}
          <motion.path d={linePath('quizzes')} fill="none" stroke={SERIES.quizzes.color} strokeWidth={3}
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...springSoft, duration: 1.1 }} />
          <motion.path d={linePath('lessons')} fill="none" stroke={SERIES.lessons.color} strokeWidth={3}
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...springSoft, duration: 1.1, delay: 0.1 }} />

          {/* Weekly resting markers — a few bold dots, not one per day */}
          {series.map((s, i) => {
            if (i !== 0 && i !== DAYS - 1 && i % 7 !== 0) return null;
            return (
              <g key={i}>
                {(['quizzes', 'lessons'] as const).map(key => (
                  <motion.circle key={key} cx={xFor(i)} cy={yFor(s[key])} r={4}
                    fill={SERIES[key].color} stroke="#fff" strokeWidth={2}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ ...springBouncy, delay: 1 + i * 0.02 }} />
                ))}
              </g>
            );
          })}

          {/* Hover crosshair + bigger pop-in dots */}
          {hovered && hoverIdx !== null && (
            <g>
              <line x1={xFor(hoverIdx)} x2={xFor(hoverIdx)} y1={PAD_TOP} y2={yFor(0)}
                stroke="#d4d4d1" strokeWidth={1.5} strokeDasharray="3,3" />
              {(['quizzes', 'lessons'] as const).map(key => (
                <motion.circle key={key} cx={xFor(hoverIdx)} cy={yFor(hovered[key])} r={6}
                  fill={SERIES[key].color} stroke="#fff" strokeWidth={2.5}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springBouncy} />
              ))}
            </g>
          )}

          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="transparent" />
        </svg>

        {/* Tooltip — same card language as the rest of the app */}
        {hovered && hoverIdx !== null && (
          <div
            className="absolute top-4 bg-white shadow-lg border border-neutral-100 rounded-2xl px-4 py-3 pointer-events-none w-[168px]"
            style={
              flipLeft
                ? { right: `${100 - hoverPct}%`, marginRight: 10 }
                : { left: `${hoverPct}%`, marginLeft: 10 }
            }>
            <p className="text-xs font-black text-neutral-800 mb-2">
              {hovered.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            {(['lessons', 'quizzes'] as const).map(key => (
              <div key={key} className="flex items-center justify-between gap-3 mb-1 last:mb-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${SERIES[key].dot}`} />
                  <span className="text-[11px] text-neutral-500 truncate">{SERIES[key].label}</span>
                </div>
                <span className="text-sm font-black text-neutral-900 shrink-0">{hovered[key]}</span>
              </div>
            ))}
          </div>
        )}

        {/* X-axis — sparse, bold labels matching the bar chart's module-title style */}
        <div className="flex justify-between pt-2 pb-3 px-0.5">
          {series.filter((_, i) => i % 6 === 0 || i === DAYS - 1).map(s => (
            <span key={dateKey(s.date)} className="text-[10px] font-bold text-neutral-400">
              {s.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
