import { test } from '../../fixtures/test-fixtures';

test('@smoke merchant login shows core links and no admin', async ({ pages, roles }) => {
  await pages.login.login(roles.merchant);

  await pages.nav.expectMerchantNav();

  await pages.nav.signOut();
  await pages.nav.expectSignedOut();
});

test('@smoke merchant can open stores and checkout links pages', async ({ pages, roles }) => {
  await pages.login.login(roles.merchant);

  await pages.stores.goto();
  await pages.stores.expectFormVisible();

  await pages.checkoutLinks.goto();
  await pages.checkoutLinks.expectFormVisible();
});

test('@smoke owner sees admin link', async ({ pages, roles }) => {
  await pages.login.login(roles.owner);

  await pages.nav.expectOwnerNav();

  await pages.admin.goto();
  await pages.admin.expectVisible();
  await pages.admin.expectTitleVisible();
});
