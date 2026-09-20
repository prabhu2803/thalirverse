import { test, expect } from '@playwright/test';

// Each test picks a fresh, random name so re-running the suite never
// collides with a name from a prior run (registration is name-unique).
function freshName(prefix: string) {
  return `${prefix} ${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

test.describe('Registration', () => {
  test('step 1 blocks on mismatched passwords', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(freshName('Mismatch Test'));
    await page.locator('input[placeholder="Min 6 characters"]').fill('password1');
    await page.locator('input[placeholder="Re-enter password"]').fill('password2');
    await page.getByPlaceholder('Your answer').fill('answer');
    await page.getByRole('button', { name: 'Continue to School Details' }).click();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
    // Still on step 1 — School Name field must not be visible yet.
    await expect(page.getByPlaceholder('Greenwood High School')).toHaveCount(0);
  });

  test('step 1 blocks on short password', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(freshName('Short Pass Test'));
    await page.locator('input[placeholder="Min 6 characters"]').fill('abc');
    await page.locator('input[placeholder="Re-enter password"]').fill('abc');
    await page.getByPlaceholder('Your answer').fill('answer');
    await page.getByRole('button', { name: 'Continue to School Details' }).click();
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
  });

  test('full registration succeeds and lands on the dashboard, logged in', async ({ page }) => {
    const name = freshName('New Student');
    await page.goto('/register');

    // Step 1
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(name);
    await page.locator('input[placeholder="Min 6 characters"]').fill('FreshPass#2026');
    await page.locator('input[placeholder="Re-enter password"]').fill('FreshPass#2026');
    await page.getByPlaceholder('Your answer').fill('Chennai');
    await page.getByRole('button', { name: 'Continue to School Details' }).click();

    // Step 2
    await page.getByPlaceholder('Greenwood High School').fill('Playwright Test School');
    await page.locator('select').selectOption('9th Standard');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await page.waitForURL(/\/dashboard$/, { timeout: 45_000 });
    await expect(page.getByText(name, { exact: false })).toBeVisible();
  });

  test('registering the exact same name twice makes login ambiguous', async ({ page, request }) => {
    // resolve_login_email() requires a unique full_name match — two
    // students sharing a name must both fail to log in afterward, not
    // silently pick one. This is exactly the scenario name_based_login.sql
    // was designed around.
    const name = freshName('Duplicate Name Test');

    async function registerOnce() {
      await page.goto('/register');
      await page.getByPlaceholder('e.g. Arjun Kumar').fill(name);
      await page.locator('input[placeholder="Min 6 characters"]').fill('DupePass#2026');
      await page.locator('input[placeholder="Re-enter password"]').fill('DupePass#2026');
      await page.getByPlaceholder('Your answer').fill('answer');
      await page.getByRole('button', { name: 'Continue to School Details' }).click();
      await page.getByPlaceholder('Greenwood High School').fill('Playwright Test School');
      await page.locator('select').selectOption('9th Standard');
      await page.getByRole('button', { name: 'Create Account' }).click();
      await page.waitForURL(/\/dashboard$/, { timeout: 45_000 });
      await page.evaluate(() => localStorage.clear());
    }

    await registerOnce();
    await registerOnce();

    await page.goto('/login');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(name);
    await page.getByPlaceholder('••••••••').fill('DupePass#2026');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page.getByText(/couldn.?t find a single account/i)).toBeVisible({ timeout: 10_000 });
  });
});
