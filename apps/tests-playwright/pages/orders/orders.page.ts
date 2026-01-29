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

  orderItem(productName: string) {
    return this.page.getByTestId(ordersLocators.item).filter({ hasText: productName });
  }

  async setStatus(productName: string, statusLabel: string) {
    const item = this.orderItem(productName);
    const select = item.getByRole('combobox');
    await select.selectOption({ label: statusLabel });
  }

  async expectStatus(productName: string, statusLabel: string) {
    await expect(this.orderItem(productName)).toContainText(statusLabel);
  }

  async openOrder(productName: string) {
    await this.orderItem(productName).click();
    await expect(this.page).toHaveURL(/\/orders\//);
  }

  async expectDetailStatus(statusLabel: string) {
    await expect(this.page.getByText('Status', { exact: true })).toBeVisible();
    await expect(this.page.getByText(statusLabel, { exact: true })).toBeVisible();
  }
}
