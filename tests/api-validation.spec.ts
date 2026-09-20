import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';
import { SUPABASE_URL, ANON_KEY, signInAs, getProfileIdByName } from './db-helpers';

// These hit the Next.js API routes directly, bypassing the admin UI
// entirely — the UI already enforces some of this client-side (e.g. the
// Add Admin form itself checks password length before ever calling the
// API), so these are the only coverage of the API's OWN server-side
// validation: what actually stops a bypassed/malicious client, not just
// a well-behaved one.
const BASE = 'http://localhost:3000';

test.describe('/api/admin/create-admin', () => {
  test('rejects with no auth token', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/create-admin`, { data: { fullName: 'X', password: 'longenough' } });
    expect(res.status()).toBe(401);
  });

  test('rejects a non-admin caller', async ({ request }) => {
    const token = await signInAs(ACCOUNTS.student.name, ACCOUNTS.student.password);
    const res = await request.post(`${BASE}/api/admin/create-admin`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { fullName: 'Should Not Be Created', password: 'longenough' },
    });
    expect(res.status()).toBe(403);
  });

  test('rejects a short password even from a Super Admin caller', async ({ request }) => {
    const token = await signInAs(ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    const res = await request.post(`${BASE}/api/admin/create-admin`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { fullName: `Short Pw Admin ${Date.now()}`, password: 'abc' },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/at least 6 characters/i);
  });

  test('rejects a duplicate exact name', async ({ request }) => {
    const token = await signInAs(ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    const res = await request.post(`${BASE}/api/admin/create-admin`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { fullName: ACCOUNTS.student.name, password: 'longenough' }, // Praveen Kumar already exists
    });
    expect(res.status()).toBe(409);
  });
});

test.describe('/api/admin/set-role', () => {
  test('rejects with no auth token', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/set-role`, { data: { userId: 'x', role: 'STUDENT' } });
    expect(res.status()).toBe(401);
  });

  test('rejects a non-admin caller', async ({ request }) => {
    const token = await signInAs(ACCOUNTS.student.name, ACCOUNTS.student.password);
    const targetId = await getProfileIdByName('Divya Sri');
    const res = await request.post(`${BASE}/api/admin/set-role`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { userId: targetId, role: 'TEACHER_ADMIN' },
    });
    expect(res.status()).toBe(403);
  });

  test('rejects an invalid role value', async ({ request }) => {
    const token = await signInAs(ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    const targetId = await getProfileIdByName('Divya Sri');
    const res = await request.post(`${BASE}/api/admin/set-role`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { userId: targetId, role: 'SUPREME_LEADER' },
    });
    expect(res.status()).toBe(400);
  });

  test('rejects a Super Admin trying to demote themselves', async ({ request }) => {
    const token = await signInAs(ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    const selfId = await getProfileIdByName(ACCOUNTS.superAdmin.name);
    const res = await request.post(`${BASE}/api/admin/set-role`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { userId: selfId, role: 'STUDENT' },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/can't change your own role/i);
  });

  test('404s for a nonexistent target user', async ({ request }) => {
    const token = await signInAs(ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    const res = await request.post(`${BASE}/api/admin/set-role`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { userId: '00000000-0000-0000-0000-000000000000', role: 'STUDENT' },
    });
    expect(res.status()).toBe(404);
  });
});

test.describe('/api/auth/reset-password', () => {
  test('rejects missing name/answer', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/reset-password`, { data: { newPassword: 'longenough' } });
    expect(res.status()).toBe(400);
  });

  test('rejects a short new password', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/reset-password`, {
      data: { fullName: ACCOUNTS.student.name, answer: 'whatever', newPassword: 'abc' },
    });
    expect(res.status()).toBe(400);
  });

  test('rejects a name/answer combination that doesn\'t verify', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/reset-password`, {
      data: { fullName: 'Nobody Real Here', answer: 'whatever', newPassword: 'longenough' },
    });
    expect(res.status()).toBe(401);
  });
});
