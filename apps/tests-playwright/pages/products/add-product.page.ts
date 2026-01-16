import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { addProductLocators } from './add-product.locators';

type AddProductInput = {
  name: string;
  price: string;
  quantity?: string;
  storeLabel?: string;
  description?: string;
  imageUrl?: string;
};

export class AddProductPage {
  constructor(private readonly page: Page) {}

  async goto(storeId?: string) {
    const url = storeId ? `/products/new?store=${encodeURIComponent(storeId)}` : '/products/new';
    await this.page.goto(url);
  }

  container() {
    return this.page.getByTestId(addProductLocators.page);
  }

  form() {
    return this.page.getByTestId(addProductLocators.form);
  }

  nameField() {
    return this.page.getByTestId(addProductLocators.name);
  }

  priceField() {
    return this.page.getByTestId(addProductLocators.price);
  }

  quantityField() {
    return this.page.getByTestId(addProductLocators.quantity);
  }

  storeSelect() {
    return this.page.getByTestId(addProductLocators.store);
  }

  descriptionField() {
    return this.page.getByTestId(addProductLocators.description);
  }

  imageUrlField() {
    return this.page.getByTestId(addProductLocators.imageUrl);
  }

  submitButton() {
    return this.page.getByTestId(addProductLocators.submit);
  }

  successMessage() {
    return this.page.getByTestId(addProductLocators.success);
  }

  async expectVisible() {
    await expect(this.container()).toBeVisible();
  }

  async fillProduct(input: AddProductInput) {
    await this.nameField().fill(input.name);
    await this.priceField().fill(input.price);

    if (input.quantity) {
      await this.quantityField().fill(input.quantity);
    }

    if (input.storeLabel) {
      await this.storeSelect().selectOption({ label: input.storeLabel });
    }

    if (input.description) {
      await this.descriptionField().fill(input.description);
    }

    if (input.imageUrl) {
      await this.imageUrlField().fill(input.imageUrl);
    }
  }

  async submit() {
    await this.submitButton().click();
  }

  async expectSuccess() {
    await expect(this.successMessage()).toBeVisible();
  }
}
