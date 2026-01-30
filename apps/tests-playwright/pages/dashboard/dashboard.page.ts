import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { dashboardLocators } from './dashboard.locators';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto(storeId?: string) {
    const url = storeId ? `/dashboard?store=${encodeURIComponent(storeId)}` : '/dashboard';
    await this.page.goto(url);
  }

  container() {
    return this.page.getByTestId(dashboardLocators.page);
  }

  title() {
    return this.page.getByTestId(dashboardLocators.title);
  }

  storeList() {
    return this.page.getByTestId(dashboardLocators.storeList);
  }

  blockedOverlay() {
    return this.page.getByTestId('dashboard-store-blocked');
  }

  productsPanel() {
    return this.page.getByTestId(dashboardLocators.productsPanel);
  }

  ordersPanel() {
    return this.page.getByTestId(dashboardLocators.ordersPanel);
  }

  async expectVisible() {
    await expect(this.container()).toBeVisible();
    await expect(this.title()).toBeVisible();
  }
}
