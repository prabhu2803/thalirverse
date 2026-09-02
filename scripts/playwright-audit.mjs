// One-off manual audit script (not a permanent test suite) — logs in as
// each role, walks the main pages, opens read-only modals, and records
// console errors / dead links / broken images. Deliberately avoids
// destructive actions (delete student, bulk import, role changes, actually
// submitting a quiz) so it doesn't mutate the carefully-seeded mock data —
// those get a structural check (button exists, modal opens) instead.
//
// Usage: node scripts/playwright-audit.mjs

import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const findings = [];

function report(role, page, kind, detail) {
  findings.push({ role, page, kind, detail });
  console.log(`[${role}] ${page} :: ${kind} :: ${detail}`);
}

async function login(page, role, name, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('e.g. Arjun Kumar').fill(name);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();
  // The Supabase auth round-trip + client-side redirect takes a moment
  // longer than networkidle alone accounts for — wait explicitly for the
  // URL to leave /login instead of guessing a fixed delay.
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
  const url = page.url();
  if (url.includes('/login')) {
    const errText = await page.locator('body').innerText().catch(() => '');
    report(role, 'login', 'login-failed', `still on /login after submit. Page text: ${errText.slice(0, 200)}`);
  } else {
    report(role, 'login', 'info', `landed on ${url}`);
  }
  return url;
}

async function visit(page, role, path, label) {
  console.log(`[${role}] visiting ${label} (${path})...`);
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); };
  const onPageError = err => pageErrors.push(err.message);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  const resp = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' }).catch(e => { report(role, label, 'nav-error', e.message); return null; });
  await page.waitForTimeout(1500);

  if (resp && !resp.ok() && resp.status() !== 304) {
    report(role, label, 'http-status', `${resp.status()} for ${path}`);
  }

  const finalUrl = page.url();
  if (!finalUrl.includes(path.split('?')[0]) && path !== '/login') {
    report(role, label, 'unexpected-redirect', `${path} -> ${finalUrl}`);
  }

  // Dead nav links (href="#")
  const deadLinks = await page.locator('a[href="#"]').count();
  if (deadLinks > 0) {
    const texts = await page.locator('a[href="#"]').allTextContents();
    report(role, label, 'dead-link', `${deadLinks} href="#" link(s): ${texts.filter(Boolean).join(', ')}`);
  }

  // Broken images (naturalWidth 0 after load)
  const broken = await page.evaluate(() =>
    Array.from(document.querySelectorAll('img')).filter(img => img.complete && img.naturalWidth === 0).map(img => img.src)
  );
  if (broken.length > 0) {
    report(role, label, 'broken-image', broken.join(', '));
  }

  // Obvious render-artifact text
  const bodyText = await page.locator('body').innerText().catch(() => '');
  for (const needle of ['undefined', 'NaN', '[object Object]']) {
    if (bodyText.includes(needle)) {
      report(role, label, 'render-artifact', `page text contains "${needle}"`);
    }
  }

  if (consoleErrors.length > 0) {
    report(role, label, 'console-error', consoleErrors.slice(0, 5).join(' | '));
  }
  if (pageErrors.length > 0) {
    report(role, label, 'page-error', pageErrors.slice(0, 5).join(' | '));
  }

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  return { consoleErrors, pageErrors };
}

async function testStudent(browser) {
  const page = await browser.newPage();
  await login(page, 'STUDENT', 'Praveen Kumar', 'MockStudent#2026');

  await visit(page, 'STUDENT', '/dashboard', 'dashboard');
  // Open + close the badge modal if any badge is visible
  const badge = page.locator('text=Earned').first();
  if (await badge.count() > 0) {
    await badge.click().catch(() => {});
    await page.waitForTimeout(400);
    const closeBtn = page.getByRole('button', { name: /close/i }).first();
    if (await closeBtn.count() > 0) await closeBtn.click().catch(() => {});
  }

  await visit(page, 'STUDENT', '/explore', 'explore');
  await visit(page, 'STUDENT', '/profile', 'profile');
  await visit(page, 'STUDENT', '/leaderboard', 'leaderboard');
  await visit(page, 'STUDENT', '/notifications', 'notifications');
  await visit(page, 'STUDENT', '/courses/road-safety', 'course-view (unlocked module)');
  await visit(page, 'STUDENT', '/courses/leadership', 'course-view (should be locked -> bounce)');

  // Certificate — fetch own id via a quick DB-free trick: read from the page (profile links to it)
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
  const certLink = page.locator('a[href^="/certificate/"]').first();
  if (await certLink.count() > 0) {
    const href = await certLink.getAttribute('href');
    await visit(page, 'STUDENT', href, 'certificate (own, via profile link)');
  } else {
    report('STUDENT', 'profile', 'missing-element', 'no certificate link found on profile for a graduate account');
  }

  await visit(page, 'STUDENT', '/privacy', 'privacy');
  await visit(page, 'STUDENT', '/terms', 'terms');

  await page.close();
}

async function testTeacherAdmin(browser) {
  const page = await browser.newPage();
  await login(page, 'TEACHER_ADMIN', 'Yi Admin (Madurai)', 'TestAdmin#2026');

  await visit(page, 'TEACHER_ADMIN', '/admin/analytics', 'admin/analytics');
  await visit(page, 'TEACHER_ADMIN', '/admin', 'admin (students roster)');

  // Structural-only: open "View Progress" for the first student, then close — no delete.
  const viewBtn = page.getByRole('button', { name: /view progress/i }).first();
  if (await viewBtn.count() > 0) {
    await viewBtn.click().catch(() => {});
    await page.waitForTimeout(500);
    const closeBtn = page.getByRole('button', { name: /close/i }).first();
    if (await closeBtn.count() > 0) await closeBtn.click().catch(() => {});
    else report('TEACHER_ADMIN', 'admin', 'missing-element', 'View Progress modal has no obvious close button');
  } else {
    report('TEACHER_ADMIN', 'admin', 'missing-element', 'no "View Progress" button found in roster');
  }

  await visit(page, 'TEACHER_ADMIN', '/admin/schools', 'admin/schools');

  // Should be blocked (Super Admin only) — verify redirect happens.
  await visit(page, 'TEACHER_ADMIN', '/admin/team', 'admin/team (should redirect, TEACHER_ADMIN)');
  await visit(page, 'TEACHER_ADMIN', '/admin/modules', 'admin/modules (should redirect, TEACHER_ADMIN)');
  await visit(page, 'TEACHER_ADMIN', '/admin/quizzes', 'admin/quizzes (should redirect, TEACHER_ADMIN)');

  await page.close();
}

async function testSuperAdmin(browser) {
  const page = await browser.newPage();
  await login(page, 'SUPER_ADMIN', 'Super Admin', 'TestAdmin#2026');

  await visit(page, 'SUPER_ADMIN', '/admin/analytics', 'admin/analytics');
  await visit(page, 'SUPER_ADMIN', '/admin', 'admin (students roster)');
  await visit(page, 'SUPER_ADMIN', '/admin/schools', 'admin/schools');
  await visit(page, 'SUPER_ADMIN', '/admin/team', 'admin/team');
  await visit(page, 'SUPER_ADMIN', '/admin/modules', 'admin/modules');
  await visit(page, 'SUPER_ADMIN', '/admin/quizzes', 'admin/quizzes');

  // Open an existing quiz editor structurally (no save)
  const firstQuizRow = page.locator('a[href^="/admin/quizzes/"]').first();
  if (await firstQuizRow.count() > 0) {
    const href = await firstQuizRow.getAttribute('href');
    await visit(page, 'SUPER_ADMIN', href, 'admin/quizzes/[id] editor');
  }

  const firstModuleEdit = page.locator('a[href^="/admin/edit-module/"]').first();
  await page.goto(`${BASE}/admin/modules`, { waitUntil: 'networkidle' });
  if (await firstModuleEdit.count() > 0) {
    const href = await firstModuleEdit.getAttribute('href');
    await visit(page, 'SUPER_ADMIN', href, 'admin/edit-module/[id] editor');
  }

  await page.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    await testStudent(browser);
    await testTeacherAdmin(browser);
    await testSuperAdmin(browser);
  } finally {
    await browser.close();
  }

  console.log(`\n=== ${findings.length} finding(s) ===`);
  for (const f of findings) {
    console.log(`- [${f.role}] ${f.page} :: ${f.kind}: ${f.detail}`);
  }
})();
