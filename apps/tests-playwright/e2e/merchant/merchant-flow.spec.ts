import { test } from '../../fixtures/test-fixtures';
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

test('@smoke merchant can create store via UI', async ({ pages, roles }) => {
  const suffix = uniqueSuffix();
  const storeName = `PW Store ${suffix}`;
  const storeEmail = `store-${suffix}@example.com`;

  await pages.login.login(roles.merchant);
  await pages.stores.goto();
  await pages.stores.expectFormVisible();
  await pages.stores.createStore(storeName, storeEmail);
  await pages.stores.expectStoreCreated(storeName);
});

test('@smoke merchant can create product and see it in list', async ({ pages, roles }) => {
  const suffix = uniqueSuffix();
  const storeName = `PW Store ${suffix}`;
  const productName = `PW Product ${suffix}`;

  const api = await createApiClient(roles.merchant);
  let storeId = '';

  try {
    const store = await createStore(api.gql, { name: storeName, email: `owner-${suffix}@ex.com` });
    storeId = store.id;
  } finally {
    await api.dispose();
  }

  await pages.login.login(roles.merchant);
  await pages.addProduct.goto(storeId);
  await pages.addProduct.expectVisible();
  await pages.addProduct.fillProduct({
    name: productName,
    price: '19.99',
    quantity: '5',
    description: 'Playwright created product.',
  });
  await pages.addProduct.submit();
  await pages.addProduct.expectSuccess();

  await pages.products.goto(storeId);
  await pages.products.expectVisible();
  await pages.products.expectProductVisible(productName);
});

test('@smoke merchant can create checkout link via UI', async ({ pages, roles }) => {
  const suffix = uniqueSuffix();
  const storeName = `PW Store ${suffix}`;
  const productName = `PW Product ${suffix}`;
  const slug = `pw-link-${suffix}`;

  const api = await createApiClient(roles.merchant);
  let storeId = '';
  let productId = '';

  try {
    const store = await createStore(api.gql, { name: storeName, email: `owner-${suffix}@ex.com` });
    storeId = store.id;
    const product = await createProduct(api.gql, {
      name: productName,
      price: 12.5,
      quantity: 3,
      storeId,
    });
    productId = product.id;
  } finally {
    await api.dispose();
  }

  await pages.login.login(roles.merchant);
  await pages.checkoutLinks.goto(storeId, productId);
  await pages.checkoutLinks.expectFormVisible();
  await pages.checkoutLinks.createLink(slug);
  await pages.checkoutLinks.expectLinkCreated(slug);
});

test('@smoke orders page shows latest order', async ({ pages, roles }) => {
  const suffix = uniqueSuffix();
  const storeName = `PW Store ${suffix}`;
  const productName = `PW Product ${suffix}`;
  const slug = `pw-order-${suffix}`;

  const api = await createApiClient(roles.merchant);
  let storeId = '';

  try {
    const store = await createStore(api.gql, { name: storeName, email: `owner-${suffix}@ex.com` });
    storeId = store.id;

    const product = await createProduct(api.gql, {
      name: productName,
      price: 24.5,
      quantity: 2,
      storeId,
    });

    await createCheckoutLink(api.gql, { slug, productId: product.id, storeId });

    await checkoutByLink(api.gql, {
      slug,
      customerName: 'Playwright Buyer',
      email: `buyer-${suffix}@example.com`,
      quantity: 1,
      shippingAddress: 'Test Street 1',
    });
  } finally {
    await api.dispose();
  }

  await pages.login.login(roles.merchant);
  await pages.orders.goto(storeId);
  await pages.orders.expectVisible();
  await pages.orders.expectOrderVisible(productName);
});
