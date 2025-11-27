import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test('@smoke a11y home page', async ({ page }) => {
  await page.goto('/');
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
