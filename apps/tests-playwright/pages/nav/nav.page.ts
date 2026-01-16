import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { navLocators } from './nav.locators';

export class NavBar {
  constructor(private readonly page: Page) {}

  container() {
    return this.page.getByTestId(navLocators.nav);
  }

  signInLink() {
    return this.page.getByTestId(navLocators.signIn);
  }

  signOutButton() {
    return this.page.getByTestId(navLocators.signOut);
  }

  productsLink() {
    return this.page.getByTestId(navLocators.products);
  }

  storesLink() {
    return this.page.getByTestId(navLocators.stores);
  }

  dashboardLink() {
    return this.page.getByTestId(navLocators.dashboard);
  }

  checkoutLinksLink() {
    return this.page.getByTestId(navLocators.checkoutLinks);
  }

  adminLink() {
    return this.page.getByTestId(navLocators.admin);
  }

  private async expectCoreNav() {
    await expect(this.checkoutLinksLink()).toBeVisible();
    await expect(this.productsLink()).toBeVisible();
    await expect(this.storesLink()).toBeVisible();
    await expect(this.dashboardLink()).toBeVisible();
  }

  async expectMerchantNav() {
    await this.expectCoreNav();
    await expect(this.adminLink()).toHaveCount(0);
  }

  async expectOwnerNav() {
    await this.expectCoreNav();
    await expect(this.adminLink()).toBeVisible();
  }

  async expectSignedOut() {
    await expect(this.signInLink()).toBeVisible();
  }

  async signOut() {
    await this.signOutButton().click();
  }
}
