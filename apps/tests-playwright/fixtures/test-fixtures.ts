import { test as base, expect } from '@playwright/test';
import { createAppPages, type AppPages } from '../pages/app.pages';
import { roles } from './roles/users';

type Fixtures = {
  pages: AppPages;
  roles: typeof roles;
};

export const test = base.extend<Fixtures>({
  pages: async ({ page }, use) => {
    await use(createAppPages(page));
  },
  roles: async ({}, use) => {
    await use(roles);
  },
});

export { expect };
