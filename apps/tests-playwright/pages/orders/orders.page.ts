import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { ordersLocators } from './orders.locators';

export class OrdersPage {
  constructor(private readonly page: Page) {}

  async goto(storeId: string) {
    await this.page.goto(`/orders?store=${encodeURIComponent(storeId)}`);
  }

  container() {
    return this.page.getByTestId(ordersLocators.page);
  }

  list() {
    return this.page.getByTestId(ordersLocators.list);
  }

  async expectVisible() {
    await expect(this.container()).toBeVisible();
  }

  async expectOrderVisible(productName: string) {
    await expect(this.list()).toContainText(productName);
  }
}
