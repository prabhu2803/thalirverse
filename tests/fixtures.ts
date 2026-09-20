import { Page, Locator, expect } from '@playwright/test';

// WebKit has occasionally left these React-controlled inputs at "" even
// after fill() + a polling wait for the value to land (not just a timing
// race — the value plain doesn't take). Falls back to real keystroke-by-
// keystroke typing, which always works, but only when the fast path
// actually fails, so Chromium/Firefox/Mobile Chrome keep the fast .fill().
export async function fillReliably(input: Locator, value: string) {
  await input.fill(value);
  try {
    await expect(input).toHaveValue(value, { timeout: 2_000 });
  } catch {
    await input.fill('');
    await input.pressSequentially(value, { delay: 10 });
  }
}

// Shared local-dev fixture accounts. These exist only in the local
// Supabase stack (see scripts/seed-mock-data*.mjs + sql/seed_admins.sql
// convention) — never point this suite at a real/hosted project.
export const ACCOUNTS = {
  student: { name: 'Praveen Kumar', password: 'MockStudent#2026', school: 'Mahatama KK Nagar' },
  teacherAdmin: { name: 'Yi Admin (Madurai)', password: 'TestAdmin#2026', school: 'Mahatama KK Nagar' },
  superAdmin: { name: 'Super Admin', password: 'TestAdmin#2026' },
} as const;

// Logs in via the real /login form (name + password), matching the app's
// name-based auth flow, and waits for the post-login client-side redirect
// (dataService.login -> getActiveStudent -> router.push) to settle.
export async function loginAs(page: Page, name: string, password: string) {
  // The dashboard's one-time onboarding modal (OnboardingModal.tsx) gates
  // on a localStorage flag — every fresh Playwright context starts without
  // it, so it would otherwise cover /dashboard on every single test run,
  // silently blocking any click-based interaction there (text-visibility
  // checks don't notice since the overlay doesn't remove the DOM behind it).
  await page.addInitScript(() => localStorage.setItem('tv_onboarding_seen_v1', '1'));
  await page.goto('/login');
  const nameInput = page.getByPlaceholder('e.g. Arjun Kumar');
  const passwordInput = page.getByPlaceholder('••••••••');
  await fillReliably(nameInput, name);
  await fillReliably(passwordInput, password);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 45_000 });
}

export async function expectRedirectedToLogin(page: Page) {
  await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });
}
