import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { checkoutLinksLocators } from './checkout-links.locators';

export class CheckoutLinksPage {
  constructor(private readonly page: Page) {}

  async goto(storeId?: string, productId?: string) {
    const params = new URLSearchParams();
    if (storeId) params.set('store', storeId);
    if (productId) params.set('productId', productId);
    const query = params.toString();
    const url = query ? `/checkout-links?${query}` : '/checkout-links';
    await this.page.goto(url);
  }

  container() {
    return this.page.getByTestId(checkoutLinksLocators.page);
  }

  form() {
    return this.page.getByTestId(checkoutLinksLocators.form);
  }

  slugField() {
    return this.page.getByTestId(checkoutLinksLocators.slug);
  }

  submitButton() {
    return this.page.getByTestId(checkoutLinksLocators.submit);
  }

  message() {
    return this.page.getByTestId(checkoutLinksLocators.message);
  }

  async expectVisible() {
    await expect(this.container()).toBeVisible();
  }

  async expectFormVisible() {
    await expect(this.form()).toBeVisible();
  }

  async createLink(slug: string) {
    await this.slugField().fill(slug);
    await this.submitButton().click();
  }

  async expectLinkCreated(slug: string) {
    await expect(this.message()).toBeVisible();
    await expect(this.message()).toContainText(slug);
  }
}
