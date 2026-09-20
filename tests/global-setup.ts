// Turbopack compiles each route on first request — 20-40s on this
// project's slow (E:) filesystem. Hitting every route the suite visits
// once, sequentially, before tests start decouples "does the app behave
// correctly" from "is this the first time Turbopack has seen this route."
const ROUTES = [
  '/', '/login', '/register', '/forgot-password', '/dashboard', '/explore', '/leaderboard', '/profile',
  '/notifications', '/privacy', '/terms',
  '/courses/road-safety', '/courses/masoom', '/certificate/warmup-compile-only',
  '/quiz/road-safety', '/quiz/road-safety/results',
  '/admin', '/admin/analytics', '/admin/schools', '/admin/team', '/admin/modules', '/admin/quizzes',
  '/admin/quizzes/road-safety', '/admin/edit-module/road-safety',
];

// API routes compile on first request too (any HTTP method triggers it,
// even one that 405s) — admin-team-crud.spec.ts's create-admin call timed
// out once because this route had never been hit before.
const API_ROUTES = [
  '/api/admin/bulk-import-students', '/api/admin/create-admin', '/api/admin/set-role',
  '/api/auth/reset-password', '/api/gap-coach/generate', '/api/send-email',
];

export default async function globalSetup() {
  const base = 'http://localhost:3000';
  for (const path of [...ROUTES, ...API_ROUTES]) {
    try {
      await fetch(`${base}${path}`, { signal: AbortSignal.timeout(60_000) });
    } catch {
      // Best-effort warm-up — a slow/failed pre-warm just means that
      // route's own test pays the cold-compile cost instead.
    }
  }
}
