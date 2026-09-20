import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ACCOUNTS, loginAs } from './fixtures';

// Automated a11y scanning catches a real, useful subset of issues (missing
// alt text, insufficient contrast, unlabeled form controls, invalid ARIA)
// but not everything (keyboard-trap flows, screen-reader narrative sense) —
// treat this as a floor, not a full audit. Only "critical" and "serious"
// impact violations fail the test; "moderate"/"minor" are logged for
// visibility without blocking, since this app wasn't built against a
// specific WCAG target and a hard-fail on every nit isn't the goal here.
async function scanAndAssert(page: any) {
  // Framer-motion entrance animations (fade/scale-in) are still mid-transition
  // right after navigation — scanning then can catch an element at opacity:0
  // with a transient blended computed color, producing a bogus contrast
  // "violation" that isn't the page's real, settled appearance.
  await page.waitForTimeout(1_500);
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
  if (blocking.length > 0) {
    console.log(JSON.stringify(blocking.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })), null, 2));
  }
  expect(blocking, `Critical/serious a11y violations found (see console output for details)`).toEqual([]);
}

test.describe('Accessibility (automated floor, not a full audit)', () => {
  test('homepage', async ({ page }) => {
    await page.goto('/');
    await scanAndAssert(page);
  });

  test('login page', async ({ page }) => {
    await page.goto('/login');
    await scanAndAssert(page);
  });

  test('register page', async ({ page }) => {
    await page.goto('/register');
    await scanAndAssert(page);
  });

  test('student dashboard', async ({ page }) => {
    await loginAs(page, ACCOUNTS.student.name, ACCOUNTS.student.password);
    await scanAndAssert(page);
  });

  test('admin analytics (Super Admin)', async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdmin.name, ACCOUNTS.superAdmin.password);
    await scanAndAssert(page);
  });
});
