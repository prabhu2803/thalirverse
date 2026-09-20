import { test, expect } from '@playwright/test';
import { SUPABASE_URL, ANON_KEY, createAuthUser, deleteAuthUser, signInAs, completeModuleLessons, rest } from './db-helpers';

test.describe('Concurrency / race conditions', () => {
  test('two simultaneous new-school registrations resolve to the same school row, not duplicates', async ({ request }) => {
    const schoolName = `Concurrent School ${Date.now()}`;

    // Fire both RPC calls at once — exactly the race find_or_create_school()'s
    // ON CONFLICT ... DO UPDATE ... RETURNING is meant to resolve atomically.
    const [res1, res2] = await Promise.all([
      request.post(`${SUPABASE_URL}/rest/v1/rpc/find_or_create_school`, {
        headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
        data: { p_name: schoolName, p_district: 'Chennai' },
      }),
      request.post(`${SUPABASE_URL}/rest/v1/rpc/find_or_create_school`, {
        headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
        data: { p_name: schoolName, p_district: 'Chennai' },
      }),
    ]);
    const id1 = await res1.json();
    const id2 = await res2.json();
    expect(id1).toBe(id2);

    const rows = await rest(`schools?name=eq.${encodeURIComponent(schoolName)}&select=id`);
    expect(rows).toHaveLength(1); // exactly one row, not two

    await rest(`schools?id=eq.${id1}`, { method: 'DELETE' });
  });

  test('awarding XP twice concurrently for the same attempt only grants it once', async ({ request }) => {
    const name = `Concurrency XP Test ${Date.now()}`;
    const password = 'ConcXp#2026';
    const user = await createAuthUser(name, password, { school: 'X', standard: '9th Standard', section: 'A', district: 'Chennai' });
    await completeModuleLessons(user.id, 'road-safety', ['rs-1', 'rs-2']);

    const attemptRows = await rest('quiz_attempts', {
      method: 'POST',
      prefer: 'return=representation',
      body: [{ student_id: user.id, quiz_id: 'quiz-rs', score: 100, passed: true }],
    });
    const attemptId = attemptRows[0].id;

    const token = await signInAs(name, password);
    const call = () => request.post(`${SUPABASE_URL}/rest/v1/rpc/award_quiz_xp`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { p_attempt_id: attemptId },
    });

    // award_quiz_xp's own UPDATE ... WHERE xp_awarded IS NULL claim is what
    // this test actually exercises — a race here would double-grant XP.
    const [res1, res2] = await Promise.all([call(), call()]);
    const [json1] = await res1.json();
    const [json2] = await res2.json();

    // Exactly one of the two calls should have won the race (is_first_award
    // true); the other replays the same stored total rather than re-rolling.
    const firstAwards = [json1.is_first_award, json2.is_first_award].filter(Boolean).length;
    expect(firstAwards).toBe(1);
    expect(json1.total_awarded).toBe(json2.total_awarded);

    const profileRows = await rest(`profiles?id=eq.${user.id}&select=xp`);
    expect(profileRows[0].xp).toBe(json1.total_awarded); // not double-counted

    await deleteAuthUser(user.id);
  });
});
