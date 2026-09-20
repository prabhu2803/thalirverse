import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';
import { getProfileIdByName, deleteAuthUser, rest } from './db-helpers';

test.describe('Team management (Super Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    await page.goto('/admin/team');
  });

  test('create a new Teacher Admin account via Add Admin, then it can log in', async ({ page }) => {
    const name = `Playwright New Admin ${Date.now()}`;
    await page.getByRole('button', { name: 'Add Admin' }).click();
    await page.getByPlaceholder('e.g. Priya Teacher').fill(name);
    const passwordInput = page.locator('input.font-mono');
    const password = await passwordInput.inputValue();
    await page.getByRole('button', { name: 'Create Admin' }).click();
    // "Add Admin" is also the persistent page button's label, so watch the
    // modal-only field instead to detect closure.
    await expect(page.getByPlaceholder('e.g. Priya Teacher')).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByText(name)).toBeVisible();

    // The generated credentials actually work.
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(name);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL(/\/admin\/analytics$/, { timeout: 15_000 });

    // Cleanup — this account has no cleanup path in the UI (no delete-admin
    // button exists), so remove it directly.
    const id = await getProfileIdByName(name);
    if (id) await deleteAuthUser(id);
  });

  test('assign-role: promote a student to TEACHER_ADMIN and back to STUDENT', async ({ page }) => {
    // Nithya Sundar (inactive persona, Mahatma Anna Nagar) is otherwise
    // untouched by any other spec file — safe to round-trip her role.
    const targetName = 'Nithya Sundar';
    await page.getByPlaceholder('Search by name...').fill(targetName);
    await page.getByText(targetName, { exact: true }).click();
    await page.locator('select').selectOption('TEACHER_ADMIN');
    await page.getByRole('button', { name: 'Save Role' }).click();
    await expect(page.getByText('Save Role')).toHaveCount(0, { timeout: 10_000 }); // modal closed

    // Scoped to the table cell — the search dropdown's own list item shares
    // this exact text and can still be present at this instant.
    await expect(page.getByRole('cell', { name: targetName })).toBeVisible();

    // Revert.
    const id = await getProfileIdByName(targetName);
    expect(id).toBeTruthy();
    await rest(`profiles?id=eq.${id}`, { method: 'PATCH', body: { role: 'STUDENT' } });
    await rest(`admin_schools?admin_id=eq.${id}`, { method: 'DELETE' }).catch(() => {});
  });

  test('edit school assignments for the existing Teacher Admin fixture', async ({ page }) => {
    await expect(page.getByText(ACCOUNTS.teacherAdmin.name)).toBeVisible();
    const row = page.locator('tr').filter({ hasText: ACCOUNTS.teacherAdmin.name });
    await row.getByTitle('Edit school assignments').click();
    // The table row behind the modal shares this exact text, so scope to
    // the modal's own heading to confirm it actually opened.
    await expect(page.getByRole('heading', { name: ACCOUNTS.teacherAdmin.name })).toBeVisible();
    // Assignment list should already show the one school this fixture was
    // seeded with — confirm the checkbox reflects that without changing it.
    const checkbox = page.locator('label').filter({ hasText: ACCOUNTS.teacherAdmin.school }).locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});
