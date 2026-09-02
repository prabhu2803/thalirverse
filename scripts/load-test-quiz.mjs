// Empirical capacity probe — not a permanent test. Measures how the LIVE
// Supabase project actually responds to bursts of concurrent "load a quiz
// page" traffic, at increasing concurrency, so we can report a real number
// instead of a guessed one. Read-only: never inserts into quiz_attempts,
// so it can't pollute seeded data or award fake XP.
//
// Usage: node scripts/load-test-quiz.mjs

import fs from 'node:fs';

const env = {};
fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
});
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`login failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// Resolve the actual login email the app's resolve_login_email RPC would
// find for this display name (students log in by name, not email).
async function resolveEmail(fullName) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/resolve_login_email`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_full_name: fullName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`resolve_login_email failed: ${JSON.stringify(data)}`);
  return data;
}

// One simulated student loading the road-safety quiz page: replicates the
// real read bundle (getActiveStudent, getModule, getModules-for-gating,
// getProgress, getQuizAttempts) — ~9 short REST calls, matching
// src/lib/supabaseClient.ts and the quiz page's load effect.
async function simulateQuizPageLoad(token, studentId) {
  const headers = { apikey: ANON_KEY, Authorization: `Bearer ${token}` };
  const timings = [];
  const errors = [];

  const calls = [
    ['profiles?select=role,full_name,xp,security_question,highest_milestone_celebrated&id=eq.' + studentId],
    ['modules?select=*&id=eq.road-safety'],
    ['lessons?select=*&module_id=eq.road-safety&order=order_index'],
    ['quizzes?select=*,questions(*,answers(*))&module_id=eq.road-safety'],
    ['modules?select=*&order=order_index'],
    ['lessons?select=*&order=order_index'],
    ['quizzes?select=id,module_id'],
    ['progress?select=*&student_id=eq.' + studentId],
    ['quiz_attempts?select=*&student_id=eq.' + studentId],
  ];

  await Promise.all(calls.map(async ([path]) => {
    const start = Date.now();
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
      const elapsed = Date.now() - start;
      timings.push(elapsed);
      if (!res.ok) errors.push(`${res.status} on ${path.split('?')[0]}`);
    } catch (e) {
      errors.push(`${e.message} on ${path.split('?')[0]}`);
    }
  }));

  return { timings, errors };
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * sorted.length);
  return sorted[Math.min(idx, sorted.length - 1)];
}

async function runBurst(token, studentId, concurrency) {
  const start = Date.now();
  const results = await Promise.all(
    Array.from({ length: concurrency }, () => simulateQuizPageLoad(token, studentId))
  );
  const wallMs = Date.now() - start;

  const allTimings = results.flatMap(r => r.timings);
  const allErrors = results.flatMap(r => r.errors);
  const totalRequests = concurrency * 9;

  console.log(`\n--- Concurrency: ${concurrency} simulated students (${totalRequests} requests) ---`);
  console.log(`  Wall time for burst: ${wallMs}ms`);
  console.log(`  Per-request p50: ${percentile(allTimings, 50)}ms | p95: ${percentile(allTimings, 95)}ms | max: ${Math.max(...allTimings)}ms`);
  console.log(`  Errors: ${allErrors.length} / ${totalRequests} (${(100 * allErrors.length / totalRequests).toFixed(1)}%)`);
  if (allErrors.length > 0) {
    const sample = [...new Set(allErrors)].slice(0, 5);
    console.log(`  Sample errors: ${sample.join(' | ')}`);
  }
  return { concurrency, wallMs, p50: percentile(allTimings, 50), p95: percentile(allTimings, 95), errorRate: allErrors.length / totalRequests };
}

async function main() {
  console.log('Resolving login + authenticating as Praveen Kumar (read-only load test)...');
  const email = await resolveEmail('Praveen Kumar');
  const token = await login(email, 'MockStudent#2026');

  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&full_name=eq.Praveen%20Kumar`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  const [prof] = await profRes.json();
  const studentId = prof.id;

  const levels = [10, 25, 50, 100, 200, 400];
  const summary = [];
  for (const c of levels) {
    const r = await runBurst(token, studentId, c);
    summary.push(r);
    // Brief pause between levels so one burst's tail doesn't bleed into the next's measurement.
    await new Promise(res => setTimeout(res, 1500));
  }

  console.log('\n=== Summary ===');
  console.log('concurrency | wall(ms) | p50(ms) | p95(ms) | error%');
  summary.forEach(r => {
    console.log(`${String(r.concurrency).padEnd(11)} | ${String(r.wallMs).padEnd(8)} | ${String(r.p50).padEnd(7)} | ${String(r.p95).padEnd(7)} | ${(r.errorRate * 100).toFixed(1)}%`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
