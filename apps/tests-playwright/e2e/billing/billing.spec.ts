import { test, expect } from '../../fixtures/test-fixtures';

test('@smoke merchant can open billing page', async ({ pages, roles }) => {
  await pages.login.login(roles.merchant);
  await pages.billing.goto();
  await pages.billing.expectLoaded();
  await expect(pages.billing.upgradeButton()).toBeHidden();
});
