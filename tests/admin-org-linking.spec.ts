import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';

test.describe('School ↔ Organization linkage (Super Admin)', () => {
  test('a school created with an organization selected shows grouped under it', async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    await page.goto('/admin/schools');

    const orgName = `Linked Org ${Date.now()}`;
    const schoolName = `Linked School ${Date.now()}`;

    await page.getByRole('button', { name: 'New Organization' }).click();
    await page.getByPlaceholder('e.g. Greenwood High School').fill(orgName);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(orgName)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('0 campuses', { exact: false })).toBeVisible();

    await page.getByRole('button', { name: 'New School' }).click();
    await page.getByPlaceholder(/Greenwood High School — Chennai Campus/).fill(schoolName);
    await page.locator('select').first().selectOption({ label: orgName });
    await page.getByPlaceholder('Madurai').fill('Chennai');
    await page.getByRole('button', { name: 'Save School' }).click();
    await expect(page.getByText(schoolName)).toBeVisible({ timeout: 10_000 });

    // The school's row shows the organization it was linked to, and the
    // org card's campus count reflects the new link.
    await expect(page.locator('tr').filter({ hasText: schoolName }).getByText(orgName)).toBeVisible();
    await expect(page.getByText('1 campus', { exact: false })).toBeVisible();

    // Cleanup — deleting the school first (org delete would otherwise just
    // unassign it, per the app's own "campuses stay" confirm-dialog copy).
    await page.locator('tr').filter({ hasText: schoolName }).getByRole('button', { name: `Delete ${schoolName}` }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText(schoolName)).toHaveCount(0);

    const orgCard = page.locator('div.rounded-2xl').filter({ hasText: orgName });
    await orgCard.getByText('delete', { exact: true }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText(orgName)).toHaveCount(0);
  });
});
