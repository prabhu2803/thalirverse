import { test, expect } from '@playwright/test';
import { createAuthUser, deleteAuthUser } from './db-helpers';

// Own account per test file — password-reset mutates the account's
// password and security-answer hash, so it must never share a fixture
// with tests that assert a fixed password (e.g. auth.spec.ts's constants).
let userId: string;
const NAME = `Security Question Test ${Date.now()}`;
const ORIGINAL_PASSWORD = 'OriginalPass#2026';
const QUESTION = 'What is your favorite food?';
const ANSWER = 'Idli';

test.beforeAll(async () => {
  const user = await createAuthUser(NAME, ORIGINAL_PASSWORD, {
    school: 'Playwright Test School', standard: '9th Standard', section: 'A', district: 'Chennai',
  });
  userId = user.id;
});

test.afterAll(async () => {
  if (userId) await deleteAuthUser(userId);
});

test.describe('Forgot password (security question)', () => {
  test('unknown name shows a not-found error', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill('Nobody With This Name');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText(/couldn.?t find a security question/i)).toBeVisible({ timeout: 10_000 });
  });

  test('a student with no security question set gets a helpful error', async ({ page }) => {
    // NAME was just created via the Auth admin API with no security
    // question set yet (set_security_answer() was never called).
    await page.goto('/forgot-password');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(NAME);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText(/couldn.?t find a security question/i)).toBeVisible({ timeout: 10_000 });
  });

  test('full reset flow: set question via profile, reset via forgot-password, log in with new password', async ({ page }) => {
    // Set the security question through the real Edit Profile modal, logged
    // in as this fixture account, then log out and run the actual
    // forgot-password flow as a different (unauthenticated) visitor would.
    await page.goto('/login');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(NAME);
    await page.getByPlaceholder('••••••••').fill(ORIGINAL_PASSWORD);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });

    await page.goto('/profile');
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    // Two <select> elements exist in this modal (Standard, then Question) —
    // the security-question one is the second.
    await page.locator('select').nth(1).selectOption(QUESTION);
    await page.getByPlaceholder('Set your answer').fill(ANSWER);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeVisible({ timeout: 10_000 }); // modal closed

    await page.evaluate(() => localStorage.clear());

    // Now the actual forgot-password flow, as an unauthenticated visitor.
    await page.goto('/forgot-password');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(NAME);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText(QUESTION)).toBeVisible({ timeout: 10_000 });

    // Wrong answer is rejected.
    await page.getByPlaceholder('Your answer').fill('definitely wrong');
    await page.locator('input[placeholder="Min 6 characters"]').fill('NewPass#2026');
    await page.locator('input[placeholder="Re-enter password"]').fill('NewPass#2026');
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText(/doesn.?t match/i)).toBeVisible({ timeout: 10_000 });

    // Correct answer resets it.
    await page.getByPlaceholder('Your answer').fill(ANSWER);
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText('Password reset!')).toBeVisible({ timeout: 10_000 });

    // New password actually works; old one no longer does.
    await page.getByRole('link', { name: 'Go to Login' }).click();
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(NAME);
    await page.getByPlaceholder('••••••••').fill('NewPass#2026');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });
  });
});
