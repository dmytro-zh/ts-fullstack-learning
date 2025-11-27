import { Page, expect } from '@playwright/test';
import { cartLocators } from './cart.locators';

export class CartPage {
  constructor(private readonly page: Page) {}

  async goto() { await this.page.goto('/'); }

  async addFirstProduct() {
    const first = this.page.locator(cartLocators.productItem).first();
    await expect(first).toBeVisible();
    await first.locator(cartLocators.addToCartBtn).click();
  }

  async assertItemVisible() {
    await expect(this.page.locator(cartLocators.cartItem).first()).toBeVisible();
  }

  async removeFirstItem() {
    const item = this.page.locator(cartLocators.cartItem).first();
    await expect(item).toBeVisible();
    await item.locator(cartLocators.removeFromCartBtn).click();
  }

  async assertCartEmpty() {
    await expect(this.page.locator(cartLocators.cartEmpty)).toBeVisible();
  }
}
