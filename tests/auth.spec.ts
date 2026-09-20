import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs, expectRedirectedToLogin } from './fixtures';

test.describe('Authentication', () => {
  test('student login redirects to /dashboard', async ({ page }) => {
    await loginAs(page, ACCOUNTS.student.name, ACCOUNTS.student.password);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('teacher admin login redirects to /admin/analytics', async ({ page }) => {
    await loginAs(page, ACCOUNTS.teacherAdmin.name, ACCOUNTS.teacherAdmin.password);
    await expect(page).toHaveURL(/\/admin\/analytics$/);
  });

  test('super admin login redirects to /admin/analytics', async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    await expect(page).toHaveURL(/\/admin\/analytics$/);
  });

  test('wrong password shows an error and stays on /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(ACCOUNTS.student.name);
    await page.getByPlaceholder('••••••••').fill('definitely-wrong-password');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page.getByText(/login failed|invalid/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('unknown name shows an error and stays on /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill('Nobody Registered Here');
    await page.getByPlaceholder('••••••••').fill('whatever123');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page.getByText(/couldn.?t find|login failed/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login$/);
  });

  test.describe('unauthenticated access is blocked', () => {
    test('/dashboard redirects to /login', async ({ page }) => {
      await page.goto('/dashboard');
      await expectRedirectedToLogin(page);
    });

    test('/admin redirects to /login', async ({ page }) => {
      await page.goto('/admin');
      await expectRedirectedToLogin(page);
    });

    test('/admin/team redirects to /login', async ({ page }) => {
      await page.goto('/admin/team');
      await expectRedirectedToLogin(page);
    });
  });
});
