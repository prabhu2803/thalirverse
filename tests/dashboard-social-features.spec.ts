import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';
import { createAuthUser, deleteAuthUser, completeModuleLessons, getSchoolIdByName, rest } from './db-helpers';

test.describe('Class Progress panel', () => {
  test('shows aggregate classmate progress when a class exists', async ({ page }) => {
    // Praveen Kumar (10th Standard, Mahatama KK Nagar) and Arjun Selvam
    // (also 10th Standard, same school — the "streak_master" variety
    // persona) together satisfy class_size >= 2, so this is real seeded
    // data, not a fabricated fixture.
    await loginAs(page, ACCOUNTS.student.name, ACCOUNTS.student.password);
    await expect(page.getByText('Your Class')).toBeVisible();
    await expect(page.getByText('on this journey with you', { exact: false })).toBeVisible();
    await expect(page.getByText('lessons & quizzes completed', { exact: false })).toBeVisible();
  });
});

test.describe('Streak display', () => {
  test('a streak persona shows a non-zero streak with the "keep it alive" danger state', async ({ page }) => {
    // Arjun Selvam is seeded with 6 consecutive days of activity ending the
    // day the seed script ran — computeStreak()'s one-day grace window
    // keeps this a real, live 6-day streak indefinitely (only a >=2 day
    // gap breaks it), so this stays valid without re-seeding.
    await loginAs(page, 'Arjun Selvam', 'MockStudent#2026');
    await expect(page.getByText(/-day streak/, { exact: false })).toBeVisible();
    await expect(page.getByText('ends tonight', { exact: false })).toBeVisible();
  });
});

test.describe('Milestone celebration', () => {
  test('crossing a milestone tier for the first time fires the celebration and persists it', async ({ page }) => {
    const name = `Milestone Test ${Date.now()}`;
    const password = 'Milestone#2026';
    const schoolId = await getSchoolIdByName(ACCOUNTS.student.school);
    const user = await createAuthUser(name, password, {
      school: ACCOUNTS.student.school, standard: '9th Standard', section: 'A', district: 'Madurai',
    });
    if (schoolId) await rest(`profiles?id=eq.${user.id}`, { method: 'PATCH', body: { school_id: schoolId } });

    // Complete exactly one of four modules (road-safety) -> 25% overall,
    // crossing the first MILESTONE_TIERS threshold from a fresh highest_milestone_celebrated=0.
    await completeModuleLessons(user.id, 'road-safety', ['rs-1', 'rs-2']);
    await rest('quiz_attempts', { method: 'POST', body: [{ student_id: user.id, quiz_id: 'quiz-rs', score: 100, passed: true }] });

    await loginAs(page, name, password);
    // "25%" also appears in the ordinary Course Progress section, so scope
    // to the celebration overlay itself (its own fixed, high-z-index layer).
    const overlay = page.locator('div.fixed.z-\\[60\\]');
    await expect(overlay.getByText('25%', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(overlay.getByText('Rising Star')).toBeVisible();

    // It records server-side so a later visit never re-fires it. The
    // overlay auto-dismisses itself (CelebrationRocket's own 2.8s timer).
    await expect(overlay).toHaveCount(0, { timeout: 5_000 });
    const profileRows = await rest(`profiles?id=eq.${user.id}&select=highest_milestone_celebrated`);
    expect(profileRows[0].highest_milestone_celebrated).toBe(25);

    await page.reload();
    await expect(page.locator('div.fixed.z-\\[60\\]')).toHaveCount(0); // doesn't fire again

    await deleteAuthUser(user.id);
  });
});
