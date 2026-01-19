import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { registerLocators } from './register.locators';

type RegisterCredentials = {
  email: string;
  password: string;
  confirm?: string;
};

export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/register');
  }

  container() {
    return this.page.getByTestId(registerLocators.page);
  }

  emailField() {
    return this.page.getByTestId(registerLocators.email);
  }

  passwordField() {
    return this.page.getByTestId(registerLocators.password);
  }

  confirmField() {
    return this.page.getByTestId(registerLocators.confirm);
  }

  submitButton() {
    return this.page.getByTestId(registerLocators.submit);
  }

  loginLink() {
    return this.page.getByTestId(registerLocators.loginLink);
  }

  async expectFormVisible() {
    await expect(this.emailField()).toBeVisible();
    await expect(this.passwordField()).toBeVisible();
    await expect(this.confirmField()).toBeVisible();
    await expect(this.submitButton()).toBeVisible();
  }

  async register(credentials: RegisterCredentials) {
    const confirm = credentials.confirm ?? credentials.password;

    await this.goto();
    await this.emailField().fill(credentials.email);
    await this.passwordField().fill(credentials.password);
    await this.confirmField().fill(confirm);
    await this.submitButton().click();
    await this.page.waitForURL(/\/dashboard/);
  }

  async expectRedirectedToDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }
}
