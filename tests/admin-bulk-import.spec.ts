import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';
import { getProfileIdByName, deleteAuthUser } from './db-helpers';

test.describe('Bulk import students (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Bulk Import' }).click();
  });

  test('rejects a CSV missing required columns', async ({ page }, testInfo) => {
    const filePath = path.join(__dirname, 'fixtures', 'bad.csv');
    fs.writeFileSync(filePath, 'Name,Notes\nSomeone,hi\n');
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await expect(page.getByText(/Missing required columns/i)).toBeVisible();
  });

  test('previews rows and flags an in-file duplicate name', async ({ page }, testInfo) => {
    const name = `Bulk Dup ${Date.now()}`;
    const filePath = path.join(__dirname, 'fixtures', 'dupes.csv');
    fs.writeFileSync(filePath,
      `Full Name,School,Standard,Section,District,Gender\n${name},Playwright Test School,9th Standard,A,Chennai,male\n${name},Playwright Test School,9th Standard,A,Chennai,male\n`);
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await expect(page.getByText('2 rows')).toBeVisible();
    await expect(page.getByText('1 ready')).toBeVisible();
    await expect(page.getByText('Duplicate name in file')).toBeVisible();
  });

  test('imports two new students end to end, and one can log in', async ({ page }, testInfo) => {
    const nameA = `Bulk Import A ${Date.now()}`;
    const nameB = `Bulk Import B ${Date.now()}`;
    const filePath = path.join(__dirname, 'fixtures', 'import.csv');
    fs.writeFileSync(filePath,
      `Full Name,School,Standard,Section,District,Gender\n` +
      `${nameA},Playwright Test School,9th Standard,A,Chennai,male\n` +
      `${nameB},Playwright Test School,10th Standard,B,Chennai,female\n`);

    await page.locator('input[type="file"]').setInputFiles(filePath);
    await expect(page.getByText('2 ready')).toBeVisible();
    await page.getByRole('button', { name: /Import 2 Students/ }).click();
    await expect(page.getByText('2 created, 0 skipped, 0 failed')).toBeVisible({ timeout: 20_000 });

    // Extract the generated password for nameA from the results table and
    // confirm the account genuinely works, end to end through /login.
    const row = page.locator('tr').filter({ hasText: nameA });
    const password = await row.locator('td').last().textContent();
    expect(password).toBeTruthy();

    await page.getByRole('button', { name: 'close' }).click();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(nameA);
    await page.getByPlaceholder('••••••••').fill(password!.trim());
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });

    // Cleanup both imported accounts.
    for (const n of [nameA, nameB]) {
      const id = await getProfileIdByName(n);
      if (id) await deleteAuthUser(id);
    }
  });

  test('re-importing an existing exact name is skipped, not duplicated', async ({ page }, testInfo) => {
    const filePath = path.join(__dirname, 'fixtures', 'existing.csv');
    fs.writeFileSync(filePath,
      `Full Name,School,Standard,Section,District,Gender\n${ACCOUNTS.student.name},${ACCOUNTS.student.school},9th Standard,A,Madurai,male\n`);
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.getByRole('button', { name: /Import 1 Students/ }).click();
    await expect(page.getByText('0 created, 1 skipped, 0 failed')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('An account with this exact name already exists.')).toBeVisible();
  });
});
