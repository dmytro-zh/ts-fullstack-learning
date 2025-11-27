import { test, expect } from '../../fixtures/test-fixtures';

test('@smoke cart flow: add and remove item', async ({ cartPage }) => {
  await cartPage.goto();
  await cartPage.addFirstProduct();
  await cartPage.assertItemVisible();
  await cartPage.removeFirstItem();
  await cartPage.assertCartEmpty();
});
