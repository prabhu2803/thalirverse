// Single source of truth for "is this module/course complete" and module
// identity (icons/colors/images). Previously duplicated — inconsistently —
// across dashboard, profile, admin/analytics, notifications, explore, the
// landing page, and the certificate page (which used a different, wrong
// definition). Everything gamification-related builds on these.

export interface ModuleLike {
  id: string;
  title: string;
  badge_title?: string;
  order_index?: number;
  lessons?: { id: string }[];
  // undefined = unknown (assume this module has a quiz, the common case);
  // a string = has a quiz with this id; null = confirmed no quiz exists.
  quiz_id?: string | null;
}

export interface ProgressRow {
  student_id?: string;
  module_id?: string;
  lesson_id: string;
  status: string;
  completed_at?: string | null;
}

export interface QuizAttemptRow {
  student_id?: string;
  quiz_id: string;
  passed: boolean;
  score: number;
  attempted_at: string;
  xp_awarded?: number | null;
  xp_bonus_tier?: string | null;
}

// ── Module identity ──────────────────────────────────────────────────
// `soft` = chip/tile variant (profile badges, explore cards, dashboard
// achievement tiles). `strong` = hero-gradient variant (dashboard active
// module card). Icon canonicalized to `local_police` for road-safety
// (matched 3 of 4 prior copies; the landing page's `traffic` was the
// outlier and now conforms).
export const MODULE_THEME: Record<string, {
  icon: string;
  soft: { bg: string; icon: string; ring: string };
  strong: { from: string; to: string };
  tag: string;
  tagClass: string;
  image: string;
}> = {
  'road-safety': {
    icon: 'local_police',
    soft: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-200' },
    strong: { from: 'from-amber-700', to: 'to-amber-900' },
    tag: 'Foundation', tagClass: 'bg-rose-100 text-rose-700',
    image: '/courses/road-safety.svg',
  },
  masoom: {
    icon: 'shield',
    soft: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-200' },
    strong: { from: 'from-blue-700', to: 'to-blue-900' },
    tag: 'Social', tagClass: 'bg-sky-100 text-sky-700',
    image: '/courses/masoom.svg',
  },
  entrepreneurship: {
    icon: 'rocket_launch',
    soft: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-200' },
    strong: { from: 'from-purple-700', to: 'to-purple-900' },
    tag: 'Business', tagClass: 'bg-amber-100 text-amber-700',
    image: '/courses/entrepreneurship.svg',
  },
  leadership: {
    icon: 'stars',
    soft: { bg: 'bg-green-50', icon: 'text-green-600', ring: 'ring-green-200' },
    strong: { from: 'from-green-700', to: 'to-green-900' },
    tag: 'Leadership', tagClass: 'bg-purple-100 text-purple-700',
    image: '/courses/leadership.svg',
  },
};

export const DEFAULT_MODULE_THEME = {
  icon: 'auto_stories',
  soft: { bg: 'bg-neutral-50', icon: 'text-neutral-500', ring: 'ring-neutral-200' },
  strong: { from: 'from-neutral-700', to: 'to-neutral-900' },
  tag: 'Foundation', tagClass: 'bg-orange-100 text-orange-700',
  image: '',
};

export function moduleTheme(id: string) {
  return MODULE_THEME[id] ?? DEFAULT_MODULE_THEME;
}

// ── Completion logic ─────────────────────────────────────────────────

// Real quiz ids don't follow a `quiz-${moduleId}` pattern (they're short
// hand-picked ids like 'quiz-rs' for the 'road-safety' module) — use the
// real id attached by dataService.getModules() when available, and only
// fall back to the (usually-wrong) guess for callers that built a module
// object without fetching quiz info at all.
export function resolveQuizId(module: ModuleLike): string {
  return module.quiz_id ?? `quiz-${module.id}`;
}

// A module is complete once its lessons are finished AND its quiz is
// passed (unless module.quiz_id is explicitly null, confirming there's no
// quiz to take). "Undefined" quiz_id (module wasn't fetched with quiz info)
// defaults to assuming a quiz is required — the common case in this app —
// rather than silently allowing lesson-only completion.
export function isModuleComplete(module: ModuleLike, progress: ProgressRow[], quizAttempts: QuizAttemptRow[]): boolean {
  const lessonIds = (module.lessons ?? []).map(l => l.id);
  const quizId = resolveQuizId(module);
  const quizPassed = quizAttempts.some(a => a.quiz_id === quizId && a.passed);
  if (!lessonIds.length) {
    return quizPassed;
  }
  const lessonsDone = lessonIds.every(lid => progress.some(p => p.lesson_id === lid && p.status === 'COMPLETED'));
  if (!lessonsDone) return false;
  if (module.quiz_id === null) return true;
  return quizPassed;
}

export function getModuleProgress(module: ModuleLike, progress: ProgressRow[], quizAttempts: QuizAttemptRow[]) {
  const lessons = module.lessons ?? [];
  const quizId = resolveQuizId(module);
  if (!lessons.length) {
    const passed = quizAttempts.some(a => a.quiz_id === quizId && a.passed);
    return { percent: passed ? 100 : 0, completed: 0, total: 0 };
  }
  const done = progress.filter(p => lessons.some(l => l.id === p.lesson_id) && p.status === 'COMPLETED').length;
  const lessonsDone = done === lessons.length;
  const requiresQuiz = module.quiz_id !== null;
  const quizPassed = quizAttempts.some(a => a.quiz_id === quizId && a.passed);
  // Caps at 99% once lessons are done but the (required) quiz isn't passed
  // yet, so the percent shown never claims 100% ahead of isModuleComplete
  // actually being true.
  const rawPercent = Math.round((done / lessons.length) * 100);
  const percent = lessonsDone && requiresQuiz && !quizPassed ? 99 : rawPercent;
  return { percent, completed: done, total: lessons.length };
}

export function isGraduate(modules: ModuleLike[], progress: ProgressRow[], quizAttempts: QuizAttemptRow[]): boolean {
  return modules.length > 0 && modules.every(m => isModuleComplete(m, progress, quizAttempts));
}

export function getOverallCompletionPct(modules: ModuleLike[], progress: ProgressRow[], quizAttempts: QuizAttemptRow[]): number {
  if (modules.length === 0) return 0;
  const completed = modules.filter(m => isModuleComplete(m, progress, quizAttempts)).length;
  return Math.round((completed / modules.length) * 100);
}

export function getBadgeEarnedDate(module: ModuleLike, progress: ProgressRow[], quizAttempts: QuizAttemptRow[]): Date | null {
  const lessonIds = (module.lessons ?? []).map(l => l.id);
  const lessonDates = progress
    .filter(p => lessonIds.includes(p.lesson_id) && p.status === 'COMPLETED' && p.completed_at)
    .map(p => new Date(p.completed_at as string).getTime());
  const quizDates = quizAttempts
    .filter(a => a.quiz_id === resolveQuizId(module) && a.passed)
    .map(a => new Date(a.attempted_at).getTime());
  const latest = Math.max(0, ...lessonDates, ...quizDates);
  return latest > 0 ? new Date(latest) : null;
}

// ── Sequential unlocking ─────────────────────────────────────────────
// A module is unlocked if it's first in order, or every module before it
// (by order_index) is complete. Purely derived — no stored "unlocked" state.
export function isModuleUnlocked(module: ModuleLike, allModules: ModuleLike[], progress: ProgressRow[], quizAttempts: QuizAttemptRow[]): boolean {
  const sorted = [...allModules].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const idx = sorted.findIndex(m => m.id === module.id);
  if (idx <= 0) return true;
  return sorted.slice(0, idx).every(m => isModuleComplete(m, progress, quizAttempts));
}

// Index of the first not-yet-completed lesson (i.e. the next one that should
// be clickable). Lessons at or before this index are unlocked; everything
// completed stays unlocked regardless of order (never re-lock earned work).
export function getNextLessonUnlockIndex(lessons: { id: string }[], progress: ProgressRow[]): number {
  const completedIds = new Set(progress.filter(p => p.status === 'COMPLETED').map(p => p.lesson_id));
  const idx = lessons.findIndex(l => !completedIds.has(l.id));
  return idx === -1 ? lessons.length - 1 : idx;
}

// ── Streak ────────────────────────────────────────────────────────────

function dayKey(d: Date) {
  return d.toISOString().split('T')[0];
}

export function computeStreak(progress: ProgressRow[]): number {
  const dates = new Set(
    progress.filter(p => p.completed_at).map(p => dayKey(new Date(p.completed_at as string)))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (dates.has(dayKey(d))) { streak++; }
    else if (i > 0) break;
  }
  return streak;
}

// True once >=2 full calendar days have passed with zero completions since
// the most recent one — i.e. a streak that existed was allowed to lapse
// (today+yesterday alone are still within computeStreak's own grace window).
export function getMostRecentCompletionDate(progress: ProgressRow[]): Date | null {
  const dates = progress.filter(p => p.completed_at).map(p => new Date(p.completed_at as string).getTime());
  return dates.length ? new Date(Math.max(...dates)) : null;
}

export function isStreakBroken(progress: ProgressRow[]): { broken: boolean; lastDate: Date | null; lostStreakSize: number } {
  const lastDate = getMostRecentCompletionDate(progress);
  if (!lastDate) return { broken: false, lastDate: null, lostStreakSize: 0 };
  const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
  if (daysSince < 2) return { broken: false, lastDate, lostStreakSize: 0 };
  // Re-walk the streak as it stood on the last active day, to report its size.
  const dates = new Set(progress.filter(p => p.completed_at).map(p => dayKey(new Date(p.completed_at as string))));
  let size = 0;
  for (let i = 0; i <= 365; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() - i);
    if (dates.has(dayKey(d))) { size++; }
    else if (i > 0) break;
  }
  return { broken: true, lastDate, lostStreakSize: size };
}

export function hasCompletedToday(progress: ProgressRow[]): boolean {
  const today = dayKey(new Date());
  return progress.some(p => p.completed_at && dayKey(new Date(p.completed_at)) === today);
}

// ── Natural stopping point ───────────────────────────────────────────
// Gentle, non-blocking encouragement to pause after a solid session —
// never a lock. Counts today's lesson completions + quiz passes; the
// caller decides how to present it, this just answers "has enough
// happened today that a pause would be a good, not a bad, suggestion?"

export const NATURAL_STOP_THRESHOLD = 2;

export function countCompletionsToday(progress: ProgressRow[], quizAttempts: QuizAttemptRow[]): number {
  const today = dayKey(new Date());
  const lessons = progress.filter(p => p.completed_at && dayKey(new Date(p.completed_at as string)) === today).length;
  const quizzes = quizAttempts.filter(a => a.passed && dayKey(new Date(a.attempted_at)) === today).length;
  return lessons + quizzes;
}

export function shouldSuggestNaturalStop(progress: ProgressRow[], quizAttempts: QuizAttemptRow[]): boolean {
  return countCompletionsToday(progress, quizAttempts) >= NATURAL_STOP_THRESHOLD;
}

// ── Milestones ────────────────────────────────────────────────────────

export const MILESTONE_TIERS = [25, 50, 75, 100] as const;

export const MILESTONE_LABELS: Record<number, string> = {
  25: 'Rising Star',
  50: 'Halfway Hero',
  75: 'Almost There',
  100: 'Thalir Graduate',
};

export function getNextMilestone(modules: ModuleLike[], progress: ProgressRow[], quizAttempts: QuizAttemptRow[]) {
  const sorted = [...modules].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const nextModule = sorted.find(m => !isModuleComplete(m, progress, quizAttempts));
  if (!nextModule) return null;
  const lessons = nextModule.lessons ?? [];
  const completedIds = new Set(progress.filter(p => p.status === 'COMPLETED').map(p => p.lesson_id));
  const lessonsRemaining = lessons.filter(l => !completedIds.has(l.id)).length;
  const quizPassed = quizAttempts.some(a => a.quiz_id === resolveQuizId(nextModule) && a.passed);
  const currentTierIdx = sorted.findIndex(m => m.id === nextModule.id);
  const tier = MILESTONE_TIERS[Math.min(currentTierIdx, MILESTONE_TIERS.length - 1)];
  return {
    module: nextModule,
    tier,
    lessonsRemaining,
    quizRemaining: !quizPassed,
    badgeTitle: nextModule.badge_title || nextModule.title,
  };
}

// ── XP ────────────────────────────────────────────────────────────────

export function computeBaseXp(score: number, totalQuestions: number): number {
  return Math.round((score / 100) * (totalQuestions * 10) + 100);
}

export const XP_BONUS_TIERS: Record<string, { label: string; color: string; icon: string; bg: string; ring: string }> = {
  common: { label: 'Nice!', color: 'text-neutral-500', icon: 'add_circle', bg: 'bg-neutral-100', ring: 'ring-neutral-200' },
  uncommon: { label: 'Bonus!', color: 'text-blue-600', icon: 'bolt', bg: 'bg-blue-50', ring: 'ring-blue-200' },
  rare: { label: 'Great Bonus!', color: 'text-purple-600', icon: 'auto_awesome', bg: 'bg-purple-50', ring: 'ring-purple-200' },
  jackpot: { label: 'JACKPOT!', color: 'text-orange-500', icon: 'celebration', bg: 'bg-orange-50', ring: 'ring-orange-300' },
};
