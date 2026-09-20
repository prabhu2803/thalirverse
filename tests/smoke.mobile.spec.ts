import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs, fillReliably } from './fixtures';

// Cross-browser / cross-viewport smoke coverage. Kept deliberately small —
// this file runs once per configured project (chromium, firefox, webkit,
// Mobile Chrome; see playwright.config.ts's per-project testMatch), so it's
// a x4 multiplier on top of the main chromium-only suite. Broad regression
// coverage lives in the rest of the suite; this only checks the critical
// path still works and doesn't visibly break layout on a phone-width viewport.
test.describe('Cross-browser / mobile smoke', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ThalirVerse', { exact: false }).first()).toBeVisible();
  });

  test('student can log in and see the dashboard', async ({ page }) => {
    await loginAs(page, ACCOUNTS.student.name, ACCOUNTS.student.password);
    await expect(page).toHaveURL(/\/dashboard$/);
    // Dashboard shows "Welcome back, <first name>!" — not the full name.
    const firstName = ACCOUNTS.student.name.split(' ')[0];
    await expect(page.getByRole('heading', { name: firstName, exact: false })).toBeVisible();
  });

  test('explore lists modules without horizontal overflow', async ({ page }) => {
    await loginAs(page, ACCOUNTS.student.name, ACCOUNTS.student.password);
    await page.goto('/explore');
    await expect(page.getByText('Road Safety', { exact: false }).first()).toBeVisible();
    // A layout that overflows its viewport is the most common "broken on
    // mobile" symptom — the page shouldn't be wider than the viewport itself.
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for sub-pixel rounding
  });

  test('registration form is usable end to end', async ({ page }) => {
    const name = `Smoke Reg ${Date.now()}`;
    await page.goto('/register');
    await fillReliably(page.getByPlaceholder('e.g. Arjun Kumar'), name);
    await fillReliably(page.locator('input[placeholder="Min 6 characters"]'), 'SmokeTest#2026');
    await fillReliably(page.locator('input[placeholder="Re-enter password"]'), 'SmokeTest#2026');
    await fillReliably(page.getByPlaceholder('Your answer'), 'answer');
    await page.getByRole('button', { name: 'Continue to School Details' }).click();
    await fillReliably(page.getByPlaceholder('Greenwood High School'), 'Playwright Test School');
    await page.locator('select').selectOption('9th Standard');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 45_000 });
  });
});
