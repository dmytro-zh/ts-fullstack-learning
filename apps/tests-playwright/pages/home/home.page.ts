import { Page, expect } from '@playwright/test';
import { homeLocators } from './home.locators';

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto() { await this.page.goto('/'); }

  async addFirstProductToCart() {
    const first = this.page.locator(homeLocators.productItem).first();
    await expect(first).toBeVisible();
    await first.locator(homeLocators.addToCartBtn).click();
  }

  cartItems() {
    return this.page.locator(homeLocators.cartItem);
  }

  async removeFirstCartItem() {
    const item = this.cartItems().first();
    await expect(item).toBeVisible();
    await item.locator(homeLocators.removeFromCartBtn).click();
  }

  async assertCartEmpty() {
    await expect(this.page.locator(homeLocators.cartEmpty)).toBeVisible();
  }
}
