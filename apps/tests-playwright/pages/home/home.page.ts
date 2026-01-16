import { Page, expect } from '@playwright/test';
import { homeLocators } from './home.locators';

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  openDashboard() {
    return this.page.getByTestId(homeLocators.openDashboard);
  }

  addProduct() {
    return this.page.getByTestId(homeLocators.addProduct);
  }

  mainHeading() {
    return this.page.getByRole('heading', { level: 1 });
  }

  async expectPrimaryActions() {
    await expect(this.openDashboard()).toBeVisible();
    await expect(this.addProduct()).toBeVisible();
  }

  async expectHeadingVisible() {
    await expect(this.mainHeading()).toBeVisible();
  }
}
