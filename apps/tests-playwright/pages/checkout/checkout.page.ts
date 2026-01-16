import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { checkoutLocators } from './checkout.locators';

type CheckoutInput = {
  name: string;
  email: string;
  shippingAddress: string;
  quantity?: string;
  note?: string;
};

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async goto(slug: string) {
    await this.page.goto(`/c/${slug}`);
  }

  container() {
    return this.page.getByTestId(checkoutLocators.page);
  }

  emptyState() {
    return this.page.getByTestId(checkoutLocators.emptyState);
  }

  form() {
    return this.page.getByTestId(checkoutLocators.form);
  }

  nameField() {
    return this.page.getByTestId(checkoutLocators.name);
  }

  emailField() {
    return this.page.getByTestId(checkoutLocators.email);
  }

  quantityField() {
    return this.page.getByTestId(checkoutLocators.quantity);
  }

  shippingAddressField() {
    return this.page.getByTestId(checkoutLocators.shippingAddress);
  }

  noteField() {
    return this.page.getByTestId(checkoutLocators.note);
  }

  submitButton() {
    return this.page.getByTestId(checkoutLocators.submit);
  }

  thankYouTitle() {
    return this.page.getByTestId(checkoutLocators.thankYouTitle);
  }

  orderDetails() {
    return this.page.getByTestId(checkoutLocators.orderDetails);
  }

  async expectLoaded(productName?: string) {
    await expect(this.container()).toBeVisible();
    if (productName) {
      await expect(this.page.getByText(productName)).toBeVisible();
    }
  }

  async expectEmptyState() {
    await expect(this.emptyState()).toBeVisible();
  }

  async fillCheckout(input: CheckoutInput) {
    await this.nameField().fill(input.name);
    await this.emailField().fill(input.email);
    await this.shippingAddressField().fill(input.shippingAddress);

    if (input.quantity) {
      await this.quantityField().fill(input.quantity);
    }

    if (input.note) {
      await this.noteField().fill(input.note);
    }
  }

  async submit() {
    await this.submitButton().click();
  }

  async waitForThankYou() {
    await expect(this.thankYouTitle()).toBeVisible();
    await expect(this.orderDetails()).toBeVisible();
  }

  async waitForThankYouOrThrow() {
    const errorBanner = this.page.getByText(/Checkout failed|Order not found|out of stock/i);

    await Promise.race([
      this.page.waitForURL(/\/thank-you\//, { waitUntil: 'domcontentloaded', timeout: 45_000 }),
      errorBanner.waitFor({ state: 'visible', timeout: 45_000 }).then(async () => {
        const message = (await errorBanner.textContent())?.trim() || 'Checkout failed';
        throw new Error(message);
      }),
    ]);
  }

  async expectEmptyStateMessage() {
    await expect(this.page.getByText('Link not found or inactive.')).toBeVisible();
  }
}
