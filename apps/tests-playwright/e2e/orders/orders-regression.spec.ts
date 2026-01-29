import { test, expect } from '../../fixtures/test-fixtures';
import {
  checkoutByLink,
  createApiClient,
  createCheckoutLink,
  createProduct,
  createStore,
  updateOrderStatus,
} from '../../helpers/api-client';

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

test('merchant can update order status from orders list', async ({ pages, roles }) => {
  const suffix = uniqueSuffix();
  const storeName = `PW Store ${suffix}`;
  const productName = `PW Product ${suffix}`;
  const slug = `pw-${suffix}`;
  const buyerEmail = `buyer+${suffix}@example.com`;

  const api = await createApiClient(roles.merchant);
  let storeId = '';

  let orderId = '';
  try {
    const store = await createStore(api.gql, { name: storeName, email: `owner-${suffix}@ex.com` });
    storeId = store.id;

    const product = await createProduct(api.gql, {
      name: productName,
      price: 12.5,
      quantity: 2,
      storeId,
    });

    await createCheckoutLink(api.gql, { slug, productId: product.id, storeId });

    const checkout = await checkoutByLink(api.gql, {
      slug,
      customerName: 'Playwright Buyer',
      email: buyerEmail,
      quantity: 1,
      shippingAddress: '123 Main St, Toronto',
    });

    orderId = checkout.orderId;
    await updateOrderStatus(api.gql, { orderId, status: 'PROCESSING' });
  } finally {
    await api.dispose();
  }

  await pages.login.login(roles.merchant);
  await pages.orders.goto(storeId);
  await pages.orders.expectVisible();
  await pages.orders.expectOrderVisible(productName);
  await pages.orders.openOrder(productName);
  await pages.orders.expectDetailStatus('Processing');
});
