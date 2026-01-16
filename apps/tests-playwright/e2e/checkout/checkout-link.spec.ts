import { test } from '../../fixtures/test-fixtures';
import {
  createApiClient,
  createCheckoutLink,
  createProduct,
  createStore,
} from '../../helpers/api-client';

test('@smoke public checkout link works', async ({ pages, roles }) => {
  test.setTimeout(60_000);
  const slug = `pw-slug-${Date.now()}`;
  const storeName = `PW Store ${Date.now()}`;
  const productName = `PW Product ${Date.now()}`;

  const api = await createApiClient(roles.merchant);
  let storeId = '';
  let productId = '';

  try {
    const store = await createStore(api.gql, { name: storeName, email: 'store@example.com' });
    storeId = store.id;
    const product = await createProduct(api.gql, {
      name: productName,
      price: 12.34,
      quantity: 5,
      storeId,
    });
    productId = product.id;
    await createCheckoutLink(api.gql, { slug, productId, storeId });
  } finally {
    await api.dispose();
  }

  // open public checkout
  await pages.checkout.goto(slug);
  await pages.checkout.expectLoaded(productName);
  await pages.checkout.fillCheckout({
    name: 'Playwright Buyer',
    email: 'buyer@example.com',
    shippingAddress: '123 Test Street, Test City',
  });
  await pages.checkout.submit();
  await pages.checkout.waitForThankYouOrThrow();
  await pages.thankYou.expectVisible();
});

test('@smoke checkout link not found shows empty state', async ({ pages }) => {
  const slug = `missing-${Date.now()}`;
  await pages.checkout.goto(slug);
  await pages.checkout.expectEmptyState();
  await pages.checkout.expectEmptyStateMessage();
});
