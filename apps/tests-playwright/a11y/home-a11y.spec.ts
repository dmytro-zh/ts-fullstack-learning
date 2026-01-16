import { test, expect } from '../fixtures/test-fixtures';
import { AxeBuilder } from '@axe-core/playwright';

test('@smoke a11y home page', async ({ page, pages }) => {
  await pages.home.goto();
  await pages.home.expectHeadingVisible();
  const accessibilityScanResults = await new AxeBuilder({ page }).include('main').analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
