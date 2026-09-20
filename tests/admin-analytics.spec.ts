import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';

test.describe('Admin analytics content', () => {
  test('SUPER_ADMIN sees platform-wide content stats and the activity chart', async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    await page.goto('/admin/analytics');
    await expect(page.getByText('Quizzes', { exact: true })).toBeVisible();
    await expect(page.getByText(/published,.*questions/)).toBeVisible();
    // ActivityTrendChart's own <svg>, distinct from the small stat-ring svgs above it.
    await expect(page.locator('svg[viewBox^="0 0 "]').last()).toBeVisible();
  });

  test('TEACHER_ADMIN analytics are scoped to their own school only', async ({ page }) => {
    await loginAs(page, ACCOUNTS.teacherAdmin.name, ACCOUNTS.teacherAdmin.password);
    await page.goto('/admin/analytics');
    // Platform-oversight widgets (admin list, content stats) are Super-Admin-only.
    await expect(page.getByText('Quizzes', { exact: true })).toHaveCount(0);
    // Recent Activity shows scoped data (not empty) but never leaks another
    // school's student — a specific name isn't asserted since "recent" is
    // capped/sorted and which student lands in it can vary.
    await expect(page.getByText('No activity yet.')).toHaveCount(0);
    await expect(page.getByText('Arun Prakash')).toHaveCount(0); // Mahatma Anna Nagar
  });
});
