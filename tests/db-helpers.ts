import fs from 'node:fs';
import path from 'node:path';

// Reads .env.local the same tolerant way scripts/seed-mock-data.mjs does
// (CRLF-safe) — this suite talks to the local Supabase stack's REST/Auth
// APIs directly with the service-role key for test setup/teardown, exactly
// like the seed scripts do, so tests never depend on the app's own UI to
// build their preconditions.
const env: Record<string, string> = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z0-9_]+)=(.*?)\r?$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
});

export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
export const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

export async function rest(path: string, opts: { method?: string; body?: any; prefer?: string } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: opts.method ?? 'GET',
    headers: { ...headers, ...(opts.prefer ? { Prefer: opts.prefer } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(`${opts.method ?? 'GET'} ${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function makePlaceholderEmail(fullName: string) {
  const slug = fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '') || 'student';
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${slug}.${suffix}@students.thalirverse.internal`;
}

export async function createAuthUser(fullName: string, password: string, metadata: Record<string, any> = {}) {
  const email = makePlaceholderEmail(fullName);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { fullName, ...metadata } }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`createAuthUser(${fullName}) -> ${res.status}: ${JSON.stringify(data)}`);
  return { id: data.id as string, email };
}

// Signs in via the same password grant the app itself uses (resolve name ->
// email first, exactly like dataService.login), returning the access token
// tests need to make requests as that user — e.g. to prove RLS actually
// enforces "own row only" from an authenticated-but-not-admin session.
export async function signInAs(fullName: string, password: string): Promise<string> {
  const email = (await rest(`rpc/resolve_login_email`, { method: 'POST', body: { p_full_name: fullName } }));
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`signInAs(${fullName}) -> ${res.status}: ${JSON.stringify(data)}`);
  return data.access_token as string;
}

export async function deleteAuthUser(userId: string) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers }).catch(() => {});
}

export async function setRole(userId: string, role: 'STUDENT' | 'TEACHER_ADMIN' | 'SUPER_ADMIN') {
  await rest(`profiles?id=eq.${userId}`, { method: 'PATCH', body: { role } });
}

export async function getSchoolIdByName(name: string): Promise<string | null> {
  const rows = await rest(`schools?name=eq.${encodeURIComponent(name)}&select=id`);
  return rows?.[0]?.id ?? null;
}

export async function getProfileIdByName(fullName: string): Promise<string | null> {
  const rows = await rest(`profiles?full_name=eq.${encodeURIComponent(fullName)}&select=id`);
  return rows?.[0]?.id ?? null;
}

// Marks every lesson in a module COMPLETED for a student, mirroring what
// actually watching each video to the end would produce — used so tests can
// reach "ready to take the quiz" without driving a real YouTube iframe
// player (not feasible headlessly; see tests/README.md).
export async function completeModuleLessons(studentId: string, moduleId: string, lessonIds: string[]) {
  await rest('progress', {
    method: 'POST',
    body: lessonIds.map(lessonId => ({
      student_id: studentId, module_id: moduleId, lesson_id: lessonId,
      status: 'COMPLETED', watch_percentage: 100, completed_at: new Date().toISOString(),
    })),
  });
}

export async function deleteSchoolByName(name: string) {
  const id = await getSchoolIdByName(name);
  if (id) await rest(`schools?id=eq.${id}`, { method: 'DELETE' }).catch(() => {});
}

export async function deleteModuleById(id: string) {
  await rest(`modules?id=eq.${id}`, { method: 'DELETE' }).catch(() => {});
}
