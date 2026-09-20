import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs, expectRedirectedToLogin } from './fixtures';

test.describe('Profile & notifications (student)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.student.name, ACCOUNTS.student.password);
  });

  test('profile shows badges and stats for a graduate', async ({ page }) => {
    await page.goto('/profile');
    // The sidebar also shows this name, so scope to the profile hero heading.
    await expect(page.getByRole('heading', { name: ACCOUNTS.student.name })).toBeVisible();
    await expect(page.getByText('Certificates')).toBeVisible();
  });

  test('editing district persists and shows on the profile badge', async ({ page }) => {
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    await page.locator('input[placeholder="Madurai"]').fill('Coimbatore');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeVisible({ timeout: 10_000 }); // modal closed
    await expect(page.getByText('Coimbatore', { exact: true })).toBeVisible();

    // Restore the seeded value so other specs relying on this fixture's
    // district (none currently do, but keep the fixture stable) aren't affected.
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    await page.locator('input[placeholder="Madurai"]').fill('Madurai');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeVisible({ timeout: 10_000 });
  });

  test('notifications page renders without error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', e => consoleErrors.push(e.message));
    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/notifications$/);
    expect(consoleErrors).toHaveLength(0);
  });

  test('notification filters switch without error', async ({ page }) => {
    await page.goto('/notifications');
    // Each filter button's accessible name includes its material-icon
    // prefix (e.g. "workspace_premium Achievements"); "All" also carries a
    // live count suffix ("all_inbox All 5") and, as a bare substring,
    // collides with the unrelated "Mark all as read" button — match its
    // icon prefix specifically to disambiguate.
    for (const filter of ['Achievements', 'Reminders', 'Modules', 'all_inbox All']) {
      await page.getByRole('button', { name: filter }).click();
    }
  });

  test('sign out ends the session and blocks further protected access', async ({ page }) => {
    await page.goto('/dashboard');
    // Praveen Kumar's seeded activity is now many days in the past, so his
    // streak reads as broken every time — the dashboard's "Streak Lost"
    // celebration modal covers the page. Real app behavior, not a bug;
    // dismiss it (its backdrop is click-to-close) before interacting further.
    // Whether it renders depends on an async streak calculation after
    // mount, so a one-shot isVisible() check races it — wait for it (or
    // its absence) properly instead.
    const streakModalHeading = page.getByRole('heading', { name: 'Streak Lost' });
    try {
      await streakModalHeading.waitFor({ state: 'visible', timeout: 3_000 });
      await page.locator('.fixed.inset-0.bg-black\\/50').first().click({ position: { x: 5, y: 5 } });
      await expect(streakModalHeading).toHaveCount(0);
    } catch {
      // Didn't appear within the window — nothing to dismiss.
    }
    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForURL(/\/login$/, { timeout: 10_000 });
    await page.goto('/dashboard');
    await expectRedirectedToLogin(page);
  });
});
