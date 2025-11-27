import { test as base } from '@playwright/test';
import { CartPage } from '../pages/cart/cart.page';
import { roles } from './roles/users';

type Fixtures = {
  cartPage: CartPage;
  user: { email: string; password: string };
};

export const test = base.extend<Fixtures>({
  cartPage: async ({ page }, use) => {
    const cartPage = new CartPage(page);
    await use(cartPage);
  },
  user: async ({}, use) => {
    await use(roles.defaultUser);
  },
});

export { expect } from '@playwright/test';
