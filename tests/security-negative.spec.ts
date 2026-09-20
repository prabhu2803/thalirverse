import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAs } from './fixtures';
import { SUPABASE_URL, ANON_KEY, signInAs, getProfileIdByName } from './db-helpers';

test.describe('RLS enforcement (direct API, no admin/service-role bypass)', () => {
  test('a student cannot read another student\'s profile row', async ({ request }) => {
    const token = await signInAs(ACCOUNTS.student.name, ACCOUNTS.student.password);
    const otherId = await getProfileIdByName('Arun Prakash'); // different school, different student
    expect(otherId).toBeTruthy();

    const res = await request.get(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${otherId}&select=id,full_name,xp`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBe(true); // RLS filters rows silently, doesn't error
    expect(await res.json()).toEqual([]);
  });

  test('a student cannot write to another student\'s progress row', async ({ request }) => {
    const token = await signInAs(ACCOUNTS.student.name, ACCOUNTS.student.password);
    const otherId = await getProfileIdByName('Arun Prakash');

    // progress_insert policy requires student_id = auth.uid() — attempting
    // to insert a row on someone else's behalf must be rejected outright.
    const res = await request.post(`${SUPABASE_URL}/rest/v1/progress`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { student_id: otherId, module_id: 'road-safety', lesson_id: 'rs-1', status: 'COMPLETED' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400); // rejected, not silently accepted
  });

  test('an anonymous (unauthenticated) request cannot read student profiles at all', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/rest/v1/profiles?select=id,full_name`, {
      headers: { apikey: ANON_KEY }, // no Authorization/session at all
    });
    expect(res.ok()).toBe(true);
    expect(await res.json()).toEqual([]); // profiles_select requires auth.uid() IS NOT NULL
  });
});

test.describe('XSS-safety of user-supplied text', () => {
  test('a name containing HTML/script tags renders as inert text, never executes', async ({ page }) => {
    const name = `<script>window.__xss=true</script>XSS Test ${Date.now()}`;

    let dialogFired = false;
    page.on('dialog', async d => { dialogFired = true; await d.dismiss(); });

    await page.goto('/register');
    await page.getByPlaceholder('e.g. Arjun Kumar').fill(name);
    await page.locator('input[placeholder="Min 6 characters"]').fill('XssTest#2026');
    await page.locator('input[placeholder="Re-enter password"]').fill('XssTest#2026');
    await page.getByPlaceholder('Your answer').fill('answer');
    await page.getByRole('button', { name: 'Continue to School Details' }).click();
    await page.getByPlaceholder('Greenwood High School').fill('Playwright Test School');
    await page.locator('select').selectOption('9th Standard');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 45_000 });

    // The literal text (including the angle brackets) should be visible as
    // plain text on the page — React escapes it by default — and the
    // embedded script must never actually execute.
    await expect(page.getByText('XSS Test', { exact: false })).toBeVisible();
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
    expect(dialogFired).toBe(false);
    // No stray <script> element with our marker was injected into the DOM.
    expect(await page.locator('script:has-text("__xss")').count()).toBe(0);
  });
});
