import { test, expect } from '../../fixtures/test-fixtures';

test('@smoke cart flow: add and remove item', async ({ homePage }) => {
  await homePage.goto();
  await homePage.addFirstProductToCart();
  await expect(homePage.cartItems().first()).toBeVisible();
  await homePage.removeFirstCartItem();
  await homePage.assertCartEmpty();
});
