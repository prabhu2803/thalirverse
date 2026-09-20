import path from 'node:path';
import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';

test.describe('Course Builder — module lifecycle (Super Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
  });

  test('create a module with a video lesson and a quiz, then delete it', async ({ page }) => {
    const title = `Playwright Module ${Date.now()}`;

    await page.goto('/admin/modules');
    await page.getByRole('button', { name: 'Create New Module' }).click();

    // Step 1: details
    await page.getByPlaceholder('e.g. Road Safety').fill(title);
    await page.getByPlaceholder('e.g. Safety').fill('Testing');
    await page.getByRole('button', { name: 'Next →' }).click();

    // Step 2: one video lesson
    await page.getByPlaceholder('Lesson title').fill('Intro Lesson');
    await page.getByPlaceholder('https://www.youtube.com/watch?v=...').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.getByRole('button', { name: 'Add Lesson' }).click();
    // A <span> elsewhere on the (now-hidden-behind-the-modal) modules list
    // can share this exact text if a prior run's module wasn't cleaned up —
    // the wizard's own queued-lesson row is specifically a <p>.
    await expect(page.locator('p').filter({ hasText: 'Intro Lesson' })).toBeVisible();
    await page.getByRole('button', { name: 'Next →' }).click();

    // Step 3: quiz
    await page.getByRole('button', { name: '+ Add Quiz' }).click();
    await page.getByPlaceholder('Enter question...').fill('Is this a test question?');
    await page.getByPlaceholder('Option A').fill('Yes');
    await page.getByPlaceholder('Option B').fill('No');
    // Option A is correct by default (makeQuestion sets index 0).

    await page.getByRole('button', { name: '✓ Create Module' }).click();
    await page.waitForURL(/\/admin\/modules$/, { timeout: 20_000 });
    await expect(page.getByText(title)).toBeVisible();

    // Clean up — delete it via the same UI (exercises the delete-confirm modal too).
    // Material Symbols icons render their DOM text as the literal icon name,
    // so getByText('delete', {exact:true}) reliably finds the delete button's icon span.
    const card = page.locator('div.rounded-3xl').filter({ hasText: title });
    await card.getByText('delete', { exact: true }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test('edit-module: add a PDF lesson via real file upload, then delete it', async ({ page }) => {
    // road-safety is a stable seeded module — add then immediately remove a
    // throwaway lesson, so we don't leave test debris in shared fixture data.
    await page.goto('/admin/edit-module/road-safety');
    await page.getByRole('button', { name: 'PDF', exact: true }).click();
    await page.locator('input[placeholder="Lesson title"]').last().fill('Playwright Upload Test');
    await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, 'fixtures', 'sample.pdf'));
    await page.getByRole('button', { name: 'Add Lesson' }).click();

    // The saved lesson's title renders inside an editable <input>, not as
    // plain text — getByText() can never match a form control's value.
    // Note this page also has a perpetual, always-empty "Add New Lesson"
    // input sharing this exact placeholder, which never goes away — so
    // scope to inputs that currently have a value (:not(:placeholder-shown))
    // to count/select only saved lessons, not that form field.
    const savedTitleInputs = page.locator('input[placeholder="Lesson title"]:not(:placeholder-shown)');
    await expect(savedTitleInputs).toHaveCount(3, { timeout: 30_000 }); // 2 seeded + this one, appended last
    const newTitleInput = savedTitleInputs.last();
    await expect(newTitleInput).toHaveValue('Playwright Upload Test');
    await expect(page.getByText('Current file')).toBeVisible();

    // Delete just this lesson. The page also has per-question delete
    // buttons further down (Quiz section) sharing the same "delete" icon
    // text, so a page-wide getByRole('button', {name:'delete'}).last()
    // would hit a question's delete button instead — scope to this
    // lesson's own row (the input's direct parent) to avoid that.
    const row = newTitleInput.locator('xpath=..');
    await row.getByText('delete', { exact: true }).click();
    await expect(savedTitleInputs).toHaveCount(2);
  });

  test('standalone Quiz Builder overview + editor reflects changes', async ({ page }) => {
    await page.goto('/admin/quizzes');
    await expect(page.getByText('Road Safety', { exact: false }).first()).toBeVisible();

    await page.goto('/admin/quizzes');
    const roadSafetyLink = page.locator('a[href^="/admin/quizzes/road-safety"]').first();
    await roadSafetyLink.click();
    await expect(page).toHaveURL(/\/admin\/quizzes\/road-safety$/);

    // Bump the pass percentage, save, then confirm the change persisted.
    // The editor loads the quiz's current values asynchronously after mount
    // — filling before that finishes races the load, which then overwrites
    // whatever was just typed. Wait for the known starting value (80) first.
    const passInput = page.locator('input[type="number"]').first();
    await expect(passInput).toHaveValue('80', { timeout: 15_000 });
    await passInput.fill('85');
    await page.getByRole('button', { name: 'Save Quiz' }).click();
    await page.waitForURL(/\/admin\/quizzes$/, { timeout: 30_000 });

    await page.goto('/admin/quizzes/road-safety');
    await expect(page.locator('input[type="number"]').first()).toHaveValue('85');

    // Restore to the default so other tests (e.g. quiz-flow.spec.ts, which
    // assumes an 80% pass bar) aren't affected by this one.
    await page.locator('input[type="number"]').first().fill('80');
    await page.getByRole('button', { name: 'Save Quiz' }).click();
    await page.waitForURL(/\/admin\/quizzes$/, { timeout: 30_000 });
  });
});
