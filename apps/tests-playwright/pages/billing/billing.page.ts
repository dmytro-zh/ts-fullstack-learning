import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { billingLocators } from './billing.locators';

export class BillingPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/billing');
  }

  container() {
    return this.page.getByTestId(billingLocators.page);
  }

  upgradeButton() {
    return this.page.getByTestId(billingLocators.upgrade);
  }

  async expectLoaded() {
    await expect(this.container()).toBeVisible();
    await expect(this.upgradeButton()).toBeVisible();
  }
}
