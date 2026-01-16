import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { thankYouLocators } from './thank-you.locators';

export class ThankYouPage {
  constructor(private readonly page: Page) {}

  title() {
    return this.page.getByTestId(thankYouLocators.title);
  }

  details() {
    return this.page.getByTestId(thankYouLocators.details);
  }

  async expectVisible() {
    await expect(this.title()).toBeVisible();
    await expect(this.details()).toBeVisible();
  }
}
