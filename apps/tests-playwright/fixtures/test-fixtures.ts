import { test as base } from '@playwright/test';
import { CartPage } from '../pages/cart/cart.page';
import { HomePage } from '../pages/home/home.page';
import { roles } from './roles/users';

type Fixtures = {
  cartPage: CartPage;
  homePage: HomePage;
  user: { email: string; password: string };
};

export const test = base.extend<Fixtures>({
  cartPage: async ({ page }, use) => { await use(new CartPage(page)); },
  homePage: async ({ page }, use) => { await use(new HomePage(page)); },
  user: async ({}, use) => { await use(roles.defaultUser); },
});

export { expect } from '@playwright/test';
