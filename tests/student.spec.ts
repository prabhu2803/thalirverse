import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';

test.describe('Student experience', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.student.name, ACCOUNTS.student.password);
  });

  test('dashboard shows the student\'s name', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(ACCOUNTS.student.name, { exact: false })).toBeVisible();
  });

  test('explore page lists all four published modules', async ({ page }) => {
    await page.goto('/explore');
    for (const title of ['Road Safety', 'Masoom', 'Entrepreneurship', 'Leadership']) {
      await expect(page.getByText(title, { exact: false }).first()).toBeVisible();
    }
  });

  test('leaderboard shows school-scoped classmates (not empty)', async ({ page }) => {
    // Praveen Kumar's school (Mahatama KK Nagar) has 5 seeded students —
    // get_school_leaderboard() should return at least his own row.
    await page.goto('/leaderboard');
    // His own row is marked "(You)" — matched separately from classmates'
    // plain-name rows, since both are visible simultaneously.
    await expect(page.getByText(`${ACCOUNTS.student.name} (You)`)).toBeVisible({ timeout: 10_000 });
  });

  test('graduate persona has an unlocked, verifiable certificate', async ({ page }) => {
    // Praveen Kumar is seeded as the "graduate" persona (all 4 modules + quizzes done).
    await page.goto('/profile');
    // "All modules complete" also appears in a separate Thalir Elite
    // milestone banner — match the certificate-unlock copy specifically.
    await expect(page.getByText('All modules complete — unlocked!', { exact: false })).toBeVisible();

    const certLink = page.locator('a[href^="/certificate/"]');
    await expect(certLink).toHaveCount(1);
    const href = await certLink.getAttribute('href');

    await page.goto(href!);
    await expect(page.getByText(/thalir graduate/i)).toBeVisible();
  });

  test('an unlocked module opens directly', async ({ page }) => {
    await page.goto('/courses/road-safety');
    await expect(page).toHaveURL(/\/courses\/road-safety$/);
  });
});

test.describe('Locked-module gating (just_started persona)', () => {
  test('visiting a locked module bounces to /dashboard with a locked flag', async ({ page }) => {
    // Karthik Raja only has road-safety in progress — masoom (next in
    // order_index) must still be locked per isModuleUnlocked().
    await loginAs(page, 'Karthik Raja', 'MockStudent#2026');
    await page.goto('/courses/masoom');
    await expect(page).toHaveURL(/\/dashboard\?locked=masoom/);
  });
});
