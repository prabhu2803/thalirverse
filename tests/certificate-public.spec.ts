import { test, expect } from '@playwright/test';
import { getProfileIdByName } from './db-helpers';

// The certificate page is a public, unauthenticated Server Component (see
// src/app/certificate/[id]/page.tsx's own comment: it reads via the
// service-role client specifically so an anonymous visitor scanning a QR
// code can verify a certificate without ever logging in).
test.describe('Certificate verification (public, unauthenticated)', () => {
  test('a graduate\'s certificate is viewable without logging in', async ({ browser }) => {
    const id = await getProfileIdByName('Praveen Kumar');
    expect(id).toBeTruthy();

    // Fresh context — no storage state, no cookies, nothing carried over
    // from any logged-in test, to genuinely exercise the anonymous path.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`/certificate/${id}`);
    // The name renders twice (page header + the certificate preview card).
    await expect(page.getByText('Praveen Kumar').first()).toBeVisible();
    await expect(page.getByText(/thalir graduate/i).first()).toBeVisible();
    await context.close();
  });

  test('a non-graduate\'s certificate id shows a not-yet-earned state, not a crash', async ({ browser }) => {
    const id = await getProfileIdByName('Karthik Raja'); // just_started persona
    expect(id).toBeTruthy();

    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('pageerror', e => consoleErrors.push(e.message));
    await page.goto(`/certificate/${id}`);
    // Whatever this state renders, it must not be a hard error page.
    await expect(page.getByText(/error|exception|500/i)).toHaveCount(0);
    expect(consoleErrors).toHaveLength(0);
    await context.close();
  });

  test('a nonexistent id does not crash the page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('pageerror', e => consoleErrors.push(e.message));
    const resp = await page.goto('/certificate/00000000-0000-0000-0000-000000000000');
    expect(resp?.status()).toBeLessThan(500);
    expect(consoleErrors).toHaveLength(0);
    await context.close();
  });
});
