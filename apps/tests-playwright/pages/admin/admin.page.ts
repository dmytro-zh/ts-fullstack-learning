import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { adminLocators } from './admin.locators';

export class AdminPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/admin');
  }

  container() {
    return this.page.getByTestId(adminLocators.page);
  }

  title() {
    return this.page.getByTestId(adminLocators.title);
  }

  async expectVisible() {
    await expect(this.container()).toBeVisible();
  }

  async expectTitleVisible() {
    await expect(this.title()).toBeVisible();
  }
}
