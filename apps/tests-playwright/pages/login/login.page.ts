import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { loginLocators } from './login.locators';

type LoginCredentials = {
  email: string;
  password: string;
};

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  container() {
    return this.page.getByTestId(loginLocators.page);
  }

  emailField() {
    return this.page.getByTestId(loginLocators.email);
  }

  passwordField() {
    return this.page.getByTestId(loginLocators.password);
  }

  submitButton() {
    return this.page.getByTestId(loginLocators.submit);
  }

  async expectVisible() {
    await expect(this.container()).toBeVisible();
  }

  async expectFormVisible() {
    await expect(this.emailField()).toBeVisible();
    await expect(this.passwordField()).toBeVisible();
    await expect(this.submitButton()).toBeVisible();
  }

  async login(credentials: LoginCredentials) {
    await this.goto();
    await this.emailField().fill(credentials.email);
    await this.passwordField().fill(credentials.password);
    await this.submitButton().click();
    await this.page.waitForURL(/\/dashboard/);
  }

  async expectRedirectedToLogin() {
    await expect(this.page).toHaveURL(/\/login/);
    await this.expectFormVisible();
  }
}
