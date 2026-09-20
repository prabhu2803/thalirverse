import { test, expect } from '@playwright/test';
import { createAuthUser, deleteAuthUser, completeModuleLessons, getSchoolIdByName, rest } from './db-helpers';

// NOTE ON SCOPE: actually watching a lesson video to completion drives a
// real YouTube iframe player via postMessage events — not something a
// headless browser can reliably simulate, and not something worth mocking
// since the player itself is a third-party embed, not app code. These tests
// instead seed "lessons already completed" directly (exactly the state a
// real completed watch-through would leave), then drive the quiz itself —
// answering, submitting, scoring, XP, retries, Gap Coach — entirely through
// the real UI, which is where the app's own logic actually lives.

let userId: string;
const NAME = `Quiz Flow Test ${Date.now()}`;
const PASSWORD = 'QuizFlow#2026';

test.beforeAll(async () => {
  const schoolId = await getSchoolIdByName('Mahatama KK Nagar');
  const user = await createAuthUser(NAME, PASSWORD, {
    school: 'Mahatama KK Nagar', standard: '9th Standard', section: 'A', district: 'Madurai',
  });
  userId = user.id;
  if (schoolId) await rest(`profiles?id=eq.${userId}`, { method: 'PATCH', body: { school_id: schoolId } });
  // road-safety lessons complete -> quiz is unlocked.
  await completeModuleLessons(userId, 'road-safety', ['rs-1', 'rs-2']);
});

test.afterAll(async () => {
  if (userId) await deleteAuthUser(userId);
});

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('e.g. Arjun Kumar').fill(NAME);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });
});

test.describe('Quiz taking', () => {
  test('answering everything correctly passes, awards XP, and shows the badge', async ({ page }) => {
    await page.goto('/quiz/road-safety');
    await expect(page).toHaveURL(/\/quiz\/road-safety$/); // confirms it wasn't bounced back (lessons/quiz correctly unlocked)

    // Road Safety quiz has 2 questions; correct answers per schema.sql seed:
    // q-rs-1 -> a2 ("Proceed with caution"), q-rs-2 -> b1 ("Facing oncoming traffic").
    await page.getByText('Proceed with caution').click();
    await page.getByRole('button', { name: /Save & Next/i }).click();
    await page.getByText('Facing oncoming traffic').click();
    await page.getByRole('button', { name: /Submit Quiz/i }).click();

    await page.waitForURL(/\/quiz\/road-safety\/results$/, { timeout: 15_000 });
    await expect(page.getByText('Quiz Completed!')).toBeVisible();
    await expect(page.getByText('2 / 2')).toBeVisible();
    await expect(page.getByText('New Badge Unlocked!')).toBeVisible();
    // XP chip renders "+<number>" — just confirm it's non-zero, not the exact
    // gacha-rolled bonus (that's randomized by design).
    await expect(page.getByText(/^\+\d+$/)).toBeVisible();
  });

  test('failing shows a retry prompt and Gap Coach remediation for wrong answers', async ({ page }) => {
    await page.goto('/quiz/road-safety');
    // Deliberately wrong answers for both questions.
    await page.getByText('Speed up to clear the intersection').click();
    await page.getByRole('button', { name: /Save & Next/i }).click();
    await page.getByText('Any side is fine').click();
    await page.getByRole('button', { name: /Submit Quiz/i }).click();

    await page.waitForURL(/\/quiz\/road-safety\/results$/, { timeout: 15_000 });
    await expect(page.getByText('Quiz Finished')).toBeVisible();
    await expect(page.getByText('0 / 2')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Try Again' })).toBeVisible();
    await expect(page.getByText('New Badge Unlocked!')).toHaveCount(0);

    // Gap Coach — real Gemini call (the one place in this suite that
    // exercises it end to end). The section shows a loading skeleton
    // immediately and deterministically; whether it then renders an
    // explanation depends on the model producing a citation that passes
    // gapCoach.ts's mechanical grounding check (verbatim quote must appear
    // in the source) — a legitimate "nothing to show" outcome by design,
    // not a bug, so this only asserts the guaranteed part: it fires, and
    // the page never breaks because of it.
    await expect(page.getByText('Before You Retry')).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(15_000); // let the real API round-trip settle
    await expect(page.getByRole('heading', { name: 'Try Again' })).toBeVisible(); // rest of the page still intact
  });

  test('the countdown timer is visible and ticking', async ({ page }) => {
    await page.goto('/quiz/road-safety');
    // "Time Remaining" label sits in its own inner flex wrapper; the time
    // itself is a sibling of that wrapper one level further up.
    const timer = page.locator('text=Time Remaining').locator('..').locator('..').getByText(/^\d{2}:\d{2}$/);
    const first = await timer.textContent();
    await page.waitForTimeout(1100);
    const second = await timer.textContent();
    expect(second).not.toBe(first);
  });

  test('review-later bookmark toggles visually', async ({ page }) => {
    await page.goto('/quiz/road-safety');
    const bookmarkBtn = page.getByRole('button', { name: 'Review Later' });
    await expect(bookmarkBtn).toBeVisible();
    await bookmarkBtn.click();
    await expect(page.getByRole('button', { name: 'Marked for Review' })).toBeVisible();
  });
});

test.describe('Quiz access gating', () => {
  test('a quiz for a module with incomplete lessons bounces back to the course page', async ({ page, request }) => {
    const schoolId = await getSchoolIdByName('Mahatama KK Nagar');
    const gatedName = `Gated Quiz Test ${Date.now()}`;
    const user = await createAuthUser(gatedName, PASSWORD, {
      school: 'Mahatama KK Nagar', standard: '9th Standard', section: 'A', district: 'Madurai',
    });
    if (schoolId) await rest(`profiles?id=eq.${user.id}`, { method: 'PATCH', body: { school_id: schoolId } });
    // Only one of two road-safety lessons complete — quiz must stay locked.
    await completeModuleLessons(user.id, 'road-safety', ['rs-1']);

    await page.goto('/login');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(gatedName);
    await page.getByPlaceholder('••••••••').fill(PASSWORD);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });

    await page.goto('/quiz/road-safety');
    await expect(page).toHaveURL(/\/courses\/road-safety$/, { timeout: 15_000 });

    await deleteAuthUser(user.id);
  });
});
