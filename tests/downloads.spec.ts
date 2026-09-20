import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';
import { getProfileIdByName } from './db-helpers';

test.describe('CSV / file downloads (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
  });

  test('roster export downloads a CSV', async ({ page }) => {
    await page.goto('/admin');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('thalirverse_roster.csv');
  });

  test('bulk-import template download has the expected headers', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Bulk Import' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Template' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('thalirverse_student_import_template.csv');
    const path = await download.path();
    const fs = await import('node:fs');
    const content = fs.readFileSync(path!, 'utf8');
    expect(content.split('\n')[0].trim()).toBe('Full Name,School,Standard,Section,District,Gender');
  });
});

test.describe('Certificate PDF download', () => {
  test('clicking "Download PDF Certificate" invokes the browser print dialog', async ({ page }) => {
    const id = await getProfileIdByName('Praveen Kumar');
    await page.goto(`/certificate/${id}`);

    // window.print() opens a native OS dialog Playwright can't interact
    // with — spy on it instead to confirm the button is wired correctly.
    await page.evaluate(() => {
      (window as any).__printCalled = false;
      window.print = () => { (window as any).__printCalled = true; };
    });
    await page.getByRole('button', { name: 'Download PDF Certificate' }).click();
    expect(await page.evaluate(() => (window as any).__printCalled)).toBe(true);
  });
});
