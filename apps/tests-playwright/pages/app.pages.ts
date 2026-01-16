import type { Page } from '@playwright/test';
import { AdminPage } from './admin/admin.page';
import { CheckoutPage } from './checkout/checkout.page';
import { CheckoutLinksPage } from './checkout-links/checkout-links.page';
import { DashboardPage } from './dashboard/dashboard.page';
import { HomePage } from './home/home.page';
import { LoginPage } from './login/login.page';
import { NavBar } from './nav/nav.page';
import { OrdersPage } from './orders/orders.page';
import { AddProductPage } from './products/add-product.page';
import { ProductsPage } from './products/products.page';
import { StoresPage } from './stores/stores.page';
import { ThankYouPage } from './thank-you/thank-you.page';

export type AppPages = {
  admin: AdminPage;
  checkout: CheckoutPage;
  checkoutLinks: CheckoutLinksPage;
  dashboard: DashboardPage;
  home: HomePage;
  login: LoginPage;
  nav: NavBar;
  orders: OrdersPage;
  addProduct: AddProductPage;
  products: ProductsPage;
  stores: StoresPage;
  thankYou: ThankYouPage;
};

export function createAppPages(page: Page): AppPages {
  return {
    admin: new AdminPage(page),
    checkout: new CheckoutPage(page),
    checkoutLinks: new CheckoutLinksPage(page),
    dashboard: new DashboardPage(page),
    home: new HomePage(page),
    login: new LoginPage(page),
    nav: new NavBar(page),
    orders: new OrdersPage(page),
    addProduct: new AddProductPage(page),
    products: new ProductsPage(page),
    stores: new StoresPage(page),
    thankYou: new ThankYouPage(page),
  };
}
