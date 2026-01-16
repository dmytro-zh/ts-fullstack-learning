import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { productsLocators } from './products.locators';

export class ProductsPage {
  constructor(private readonly page: Page) {}

  async goto(storeId: string) {
    await this.page.goto(`/products?store=${encodeURIComponent(storeId)}`);
  }

  container() {
    return this.page.getByTestId(productsLocators.page);
  }

  list() {
    return this.page.getByTestId(productsLocators.list);
  }

  emptyState() {
    return this.page.getByTestId(productsLocators.empty);
  }

  addProductLink() {
    return this.page.getByTestId(productsLocators.addProduct);
  }

  async expectVisible() {
    await expect(this.container()).toBeVisible();
  }

  async expectProductVisible(name: string) {
    await expect(this.list()).toContainText(name);
  }
}
