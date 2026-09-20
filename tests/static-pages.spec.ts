import { test, expect } from '@playwright/test';

test.describe('Static content pages', () => {
  test('privacy policy renders its sections', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByText("Children's Data", { exact: false })).toBeVisible();
  });

  test('terms & conditions renders its sections', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: 'Terms & Conditions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Eligibility', exact: false })).toBeVisible();
  });
});
