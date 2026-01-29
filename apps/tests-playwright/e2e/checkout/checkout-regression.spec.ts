import { test, expect } from '../../fixtures/test-fixtures';
import {
  checkoutByLink,
  createApiClient,
  createCheckoutLink,
  createProduct,
  createStore,
} from '../../helpers/api-client';

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

test('checkout completes and order appears for merchant', async ({ pages, roles }) => {
  const suffix = uniqueSuffix();
  const storeName = `PW Store ${suffix}`;
  const productName = `PW Product ${suffix}`;
  const slug = `pw-${suffix}`;
  const buyerEmail = `buyer+${suffix}@example.com`;

  const api = await createApiClient(roles.merchant);
  let storeId = '';

  try {
    const store = await createStore(api.gql, { name: storeName, email: `owner-${suffix}@ex.com` });
    storeId = store.id;

    const product = await createProduct(api.gql, {
      name: productName,
      price: 18.5,
      quantity: 3,
      storeId,
    });

    await createCheckoutLink(api.gql, { slug, productId: product.id, storeId });
  } finally {
    await api.dispose();
  }

  await pages.checkout.goto(slug);
  await pages.checkout.expectLoaded(productName);
  await pages.checkout.fillCheckout({
    name: 'Playwright Buyer',
    email: buyerEmail,
    shippingAddress: '123 Main St, Toronto',
    quantity: '1',
  });
  await pages.checkout.submit();
  await pages.checkout.waitForThankYouOrThrow();
  await pages.checkout.waitForThankYou();

  await pages.login.login(roles.merchant);
  await pages.orders.goto(storeId);
  await pages.orders.expectVisible();
  await pages.orders.expectOrderVisible(productName);
});

// Regression: ensure order creation via API helper still works for later status updates
// (keeps coverage of GraphQL mutation changes outside smoke suite)
test('checkoutByLink helper returns order id and checkout url', async ({ roles }) => {
  const suffix = uniqueSuffix();
  const storeName = `PW Store ${suffix}`;
  const productName = `PW Product ${suffix}`;
  const slug = `pw-${suffix}`;
  const buyerEmail = `buyer+${suffix}@example.com`;

  const api = await createApiClient(roles.merchant);

  try {
    const store = await createStore(api.gql, { name: storeName, email: `owner-${suffix}@ex.com` });
    const product = await createProduct(api.gql, {
      name: productName,
      price: 9.5,
      quantity: 1,
      storeId: store.id,
    });

    await createCheckoutLink(api.gql, { slug, productId: product.id, storeId: store.id });

    const res = await checkoutByLink(api.gql, {
      slug,
      customerName: 'Playwright Buyer',
      email: buyerEmail,
      quantity: 1,
      shippingAddress: '123 Main St, Toronto',
    });

    expect(res.orderId).toBeTruthy();
    expect(res.checkoutUrl).toBeTruthy();
  } finally {
    await api.dispose();
  }
});
