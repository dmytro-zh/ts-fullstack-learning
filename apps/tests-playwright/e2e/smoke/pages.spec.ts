import { test } from '../../fixtures/test-fixtures';

test('@smoke home page renders primary actions', async ({ pages }) => {
  await pages.home.goto();
  await pages.home.expectPrimaryActions();
});

test('@smoke login page renders form', async ({ pages }) => {
  await pages.login.goto();
  await pages.login.expectFormVisible();
});

test('@smoke protected route redirects to login', async ({ page, pages }) => {
  await page.goto('/dashboard');
  await pages.login.expectRedirectedToLogin();
});
