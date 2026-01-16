import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { storesLocators } from './stores.locators';

export class StoresPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/stores');
  }

  container() {
    return this.page.getByTestId(storesLocators.page);
  }

  form() {
    return this.page.getByTestId(storesLocators.form);
  }

  nameField() {
    return this.page.getByTestId(storesLocators.name);
  }

  emailField() {
    return this.page.getByTestId(storesLocators.email);
  }

  submitButton() {
    return this.page.getByTestId(storesLocators.submit);
  }

  successAlert() {
    return this.page.getByTestId(storesLocators.success);
  }

  errorAlert() {
    return this.page.getByTestId(storesLocators.error);
  }

  list() {
    return this.page.getByTestId(storesLocators.list);
  }

  async expectVisible() {
    await expect(this.container()).toBeVisible();
  }

  async expectFormVisible() {
    await expect(this.form()).toBeVisible();
  }

  async createStore(name: string, email?: string) {
    await this.nameField().fill(name);
    if (email) {
      await this.emailField().fill(email);
    }
    await this.submitButton().click();
  }

  async expectStoreCreated(name: string) {
    await expect(this.successAlert()).toBeVisible();
    await expect(this.list()).toContainText(name);
  }
}
