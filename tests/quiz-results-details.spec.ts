import { test, expect } from '@playwright/test';
import { createAuthUser, deleteAuthUser, completeModuleLessons, getSchoolIdByName, rest } from './db-helpers';
import { ACCOUNTS } from './fixtures';

let userId: string;
const NAME = `Quiz Details Test ${Date.now()}`;
const PASSWORD = 'QuizDetails#2026';

test.beforeAll(async () => {
  const schoolId = await getSchoolIdByName(ACCOUNTS.student.school);
  const user = await createAuthUser(NAME, PASSWORD, {
    school: ACCOUNTS.student.school, standard: '9th Standard', section: 'A', district: 'Madurai',
  });
  userId = user.id;
  if (schoolId) await rest(`profiles?id=eq.${userId}`, { method: 'PATCH', body: { school_id: schoolId } });
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

test.describe('Quiz-taking top bar and results detail', () => {
  test('"Save Draft" behaves identically to submitting — no actual draft-save exists', async ({ page }) => {
    // handleSubmit is wired to both the "Save Draft" and "Finish Attempt"
    // buttons in src/app/quiz/[id]/page.tsx — documenting that behavior
    // here since the label implies something different from what it does.
    await page.goto('/quiz/road-safety');
    await page.getByText('Proceed with caution').click();
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await page.waitForURL(/\/quiz\/road-safety\/results$/, { timeout: 15_000 });
    await expect(page.getByText('Quiz Finished')).toBeVisible(); // scored as a real (incomplete) attempt, not saved as a draft
  });

  test('"Review Answers" reveals the full performance breakdown', async ({ page }) => {
    await page.goto('/quiz/road-safety');
    await page.getByText('Proceed with caution').click();
    await page.getByRole('button', { name: /Save & Next/i }).click();
    await page.getByText('Facing oncoming traffic').click();
    await page.getByRole('button', { name: /Submit Quiz/i }).click();
    await page.waitForURL(/\/quiz\/road-safety\/results$/, { timeout: 15_000 });

    await expect(page.getByText('Performance Breakdown')).toBeVisible();
    await page.getByRole('button', { name: 'Review Answers' }).click();
    // Both seeded questions for this quiz should now be visible with a
    // correct/incorrect indicator each — road-safety's quiz only has 2
    // questions, so the "show N more" pagination path can't be reached
    // with this seed data (breakdown.length is never > 3).
    await expect(page.getByText('Question 01')).toBeVisible();
    await expect(page.getByText('Question 02')).toBeVisible();
    // Both seeded answers here are correct, so two "Correct" badges render.
    await expect(page.getByText('Correct', { exact: true })).toHaveCount(2);
  });
});
