import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';

test.describe('Schools & Organizations (Super Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    await page.goto('/admin/schools');
  });

  test('create, rename, and delete an organization', async ({ page }) => {
    const name = `Playwright Org ${Date.now()}`;
    const renamed = `${name} Renamed`;

    await page.getByRole('button', { name: 'New Organization' }).click();
    await page.getByPlaceholder('e.g. Greenwood High School').fill(name);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

    const card = page.locator('div.rounded-2xl').filter({ hasText: name });
    await card.getByText('edit', { exact: true }).click();
    await page.getByPlaceholder('e.g. Greenwood High School').fill(renamed);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(renamed)).toBeVisible({ timeout: 10_000 });

    const renamedCard = page.locator('div.rounded-2xl').filter({ hasText: renamed });
    await renamedCard.getByText('delete', { exact: true }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText(renamed)).toHaveCount(0);
  });

  test('create, edit, and delete a school', async ({ page }) => {
    const name = `Playwright School ${Date.now()}`;

    await page.getByRole('button', { name: 'New School' }).click();
    await page.getByPlaceholder(/Greenwood High School — Chennai Campus/).fill(name);
    await page.getByPlaceholder('Madurai').fill('Testville');
    await page.getByRole('button', { name: 'Save School' }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

    // Edit — change the coordinator name. That field has no placeholder, so
    // locate it via its label's sibling <div> (label + input share a parent).
    const row = page.locator('tr').filter({ hasText: name });
    await row.getByRole('button', { name: `Edit ${name}` }).click();
    const coordinatorField = page.locator('div.flex.flex-col').filter({ hasText: 'Coordinator Name' });
    await coordinatorField.locator('input').fill('Playwright Coordinator');
    await page.getByRole('button', { name: 'Save School' }).click();
    await expect(page.locator('tr').filter({ hasText: name }).getByText('Playwright Coordinator')).toBeVisible({ timeout: 10_000 });

    // Delete.
    await page.locator('tr').filter({ hasText: name }).getByRole('button', { name: `Delete ${name}` }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText(name)).toHaveCount(0);
  });

  test('search filters the schools table', async ({ page }) => {
    await page.getByPlaceholder('Search schools...').fill('zzz-no-such-school-zzz');
    await expect(page.getByText('No schools match your search.')).toBeVisible();
    await page.getByPlaceholder('Search schools...').fill('');
    await expect(page.getByText(ACCOUNTS.teacherAdmin.school)).toBeVisible();
  });
});
