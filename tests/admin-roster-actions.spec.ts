import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';
import { createAuthUser, deleteAuthUser, getSchoolIdByName, rest } from './db-helpers';

test.describe('Admin roster actions (Super Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    await page.goto('/admin');
  });

  test('View Progress modal shows per-module completion for a student', async ({ page }) => {
    const row = page.locator('tr').filter({ hasText: ACCOUNTS.student.name });
    await row.getByTitle('View Progress').click();
    await expect(page.getByRole('heading', { name: ACCOUNTS.student.name })).toBeVisible();
    // Praveen Kumar is the seeded "graduate" persona — every module 100%.
    await expect(page.getByText('Road Safety', { exact: false }).first()).toBeVisible();
    await page.getByText('close', { exact: true }).click();
    await expect(page.getByRole('heading', { name: ACCOUNTS.student.name })).toHaveCount(0);
  });

  test('deleting a student removes them from the roster', async ({ page }) => {
    const schoolId = await getSchoolIdByName(ACCOUNTS.student.school);
    const name = `Roster Delete Test ${Date.now()}`;
    const user = await createAuthUser(name, 'DeleteMe#2026', {
      school: ACCOUNTS.student.school, standard: '9th Standard', section: 'A', district: 'Madurai',
    });
    if (schoolId) await rest(`profiles?id=eq.${user.id}`, { method: 'PATCH', body: { school_id: schoolId } });

    await page.reload();
    await expect(page.getByText(name)).toBeVisible();

    const row = page.locator('tr').filter({ hasText: name });
    await row.getByTitle('Delete Student').click();
    await expect(page.getByText(`will be removed from the platform roster`)).toBeVisible();
    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.getByText(name)).toHaveCount(0);

    // dataService.deleteStudent() only removes public.profiles (no FK to
    // auth.users in this schema, same asymmetry documented in
    // sql/cleanup_broken_admin_seed.sql) — clean up the orphaned auth account.
    await deleteAuthUser(user.id);
  });
});
