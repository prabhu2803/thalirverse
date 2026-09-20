import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs, expectRedirectedToLogin } from './fixtures';

test.describe('TEACHER_ADMIN — school-scoped access', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.teacherAdmin.name, ACCOUNTS.teacherAdmin.password);
  });

  test('can reach analytics, roster, and schools', async ({ page }) => {
    for (const path of ['/admin/analytics', '/admin', '/admin/schools']) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`));
    }
  });

  test('roster is scoped to the assigned school only', async ({ page }) => {
    // Yi Admin (Madurai) is assigned only to "Mahatama KK Nagar" via
    // admin_schools — a student from a different school must not appear.
    await page.goto('/admin');
    await expect(page.getByText('Praveen Kumar')).toBeVisible();
    await expect(page.getByText('Arun Prakash')).toHaveCount(0); // belongs to Mahatma Anna Nagar
  });

  test.describe('is blocked from Super-Admin-only pages', () => {
    for (const path of ['/admin/team', '/admin/modules', '/admin/quizzes']) {
      test(`${path} redirects to /login`, async ({ page }) => {
        await page.goto(path);
        await expectRedirectedToLogin(page);
      });
    }
  });
});

test.describe('SUPER_ADMIN — platform-wide access', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
  });

  test('can reach every admin page', async ({ page }) => {
    for (const path of ['/admin/analytics', '/admin', '/admin/schools', '/admin/team', '/admin/modules', '/admin/quizzes']) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`));
    }
  });

  test('roster includes students across every school', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Praveen Kumar')).toBeVisible();   // Mahatama KK Nagar
    await expect(page.getByText('Arun Prakash')).toBeVisible();    // Mahatma Anna Nagar
    await expect(page.getByText('Yogesh Waran')).toBeVisible();    // Vivekananda Vidyalaya
  });
});
