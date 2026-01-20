import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApolloServer, defaultMerchantAuth, ensureTestUser } from '../helpers/apollo';

const CREATE_STORE = `
  mutation CreateStore($input: StoreInput!) {
    createStore(input: $input) { id name }
  }
`;

const ADD_PRODUCT = `
  mutation AddProduct($name:String!, $price:Float!, $storeId:ID!, $quantity:Int!) {
    addProduct(name:$name, price:$price, storeId:$storeId, quantity:$quantity) { id name }
  }
`;

const CREATE_LINK = `
  mutation CreateCheckoutLink($input: CheckoutLinkInput!) {
    createCheckoutLink(input:$input) {
      id
      slug
      active
      product { id }
      store { id }
    }
  }
`;

const CHECKOUT_BY_LINK = `
  mutation CheckoutByLink($input: CheckoutByLinkInput!) {
    checkoutByLink(input: $input) {
      receiptToken
      order {
        id
        status
        total
        quantity
        storeId
        productId
        checkoutLinkId
      }
    }
  }
`;

const ORDERS_BY_STORE = `
  query Orders($storeId: ID!) {
    orders(storeId: $storeId) {
      id
      status
      total
      productId
      storeId
    }
  }
`;

const UPDATE_ORDER_STATUS = `
  mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      id
      status
    }
  }
`;

const GET_ORDER = `
  query Order($id: ID!) {
    order(id: $id) {
      id
      status
      storeId
      productId
    }
  }
`;

describe('Order GraphQL flow', () => {
  let api: Awaited<ReturnType<typeof createTestApolloServer>>;

  const storeName = `Test Store Orders ${Date.now()}`;
  const productName = `Test Product Orders ${Date.now()}`;
  const slug = `test-order-slug-${Date.now()}`;

  beforeAll(async () => {
    api = await createTestApolloServer();
    await ensureTestUser(defaultMerchantAuth);
  });

  afterAll(async () => {
    await api.stop();
  });

  it('@smoke list orders by store', async () => {
    const storeData = await api.exec(
      {
        query: CREATE_STORE,
        variables: { input: { name: storeName, email: 'store-orders@example.com' } },
      },
      defaultMerchantAuth,
    );

    const storeId = (storeData as any)?.createStore?.id;
    expect(storeId).toBeTruthy();

    const productData = await api.exec(
      {
        query: ADD_PRODUCT,
        variables: { name: productName, price: 9.99, storeId, quantity: 5 },
      },
      defaultMerchantAuth,
    );

    const productId = (productData as any)?.addProduct?.id;
    expect(productId).toBeTruthy();

    const linkData = await api.exec(
      {
        query: CREATE_LINK,
        variables: { input: { slug, productId, storeId } },
      },
      defaultMerchantAuth,
    );

    const checkoutLinkId = (linkData as any)?.createCheckoutLink?.id;
    expect(checkoutLinkId).toBeTruthy();

    const checkoutData = await api.exec(
      {
        query: CHECKOUT_BY_LINK,
        variables: {
          input: {
            slug,
            customerName: 'John Doe',
            email: 'john-orders@test.dev',
            quantity: 2,
            shippingAddress: 'Toronto, ON',
            shippingNote: 'Leave at door',
          },
        },
      },
      defaultMerchantAuth,
    );

    const orderId = (checkoutData as any)?.checkoutByLink?.order?.id;
    const receiptToken = (checkoutData as any)?.checkoutByLink?.receiptToken;
    expect(orderId).toBeTruthy();
    expect(receiptToken).toBeTruthy();

    const ordersData = await api.exec(
      {
        query: ORDERS_BY_STORE,
        variables: { storeId },
      },
      defaultMerchantAuth,
    );

    const orders = (ordersData as any)?.orders ?? [];
    const ids = orders.map((o: any) => o.id);

    expect(ids).toContain(orderId);
  });

  it('@smoke update order status', async () => {
    const storeData = await api.exec(
      {
        query: CREATE_STORE,
        variables: { input: { name: `${storeName}-2`, email: 'store-orders-2@example.com' } },
      },
      defaultMerchantAuth,
    );

    const storeId = (storeData as any)?.createStore?.id;
    expect(storeId).toBeTruthy();

    const productData = await api.exec(
      {
        query: ADD_PRODUCT,
        variables: { name: `${productName}-2`, price: 19.99, storeId, quantity: 5 },
      },
      defaultMerchantAuth,
    );

    const productId = (productData as any)?.addProduct?.id;
    expect(productId).toBeTruthy();

    const linkData = await api.exec(
      {
        query: CREATE_LINK,
        variables: { input: { slug: `${slug}-2`, productId, storeId } },
      },
      defaultMerchantAuth,
    );

    const checkoutLinkId = (linkData as any)?.createCheckoutLink?.id;
    expect(checkoutLinkId).toBeTruthy();

    const checkoutData = await api.exec(
      {
        query: CHECKOUT_BY_LINK,
        variables: {
          input: {
            slug: `${slug}-2`,
            customerName: 'Jane Doe',
            email: 'jane-orders@test.dev',
            quantity: 1,
            shippingAddress: 'Toronto, ON',
          },
        },
      },
      defaultMerchantAuth,
    );

    const orderId = (checkoutData as any)?.checkoutByLink?.order?.id;
    const initialStatus = (checkoutData as any)?.checkoutByLink?.order?.status;
    const receiptToken = (checkoutData as any)?.checkoutByLink?.receiptToken;

    expect(orderId).toBeTruthy();
    expect(initialStatus).toBe('PAID');
    expect(receiptToken).toBeTruthy();

    const updData = await api.exec(
      {
        query: UPDATE_ORDER_STATUS,
        variables: { orderId, status: 'PROCESSING' },
      },
      defaultMerchantAuth,
    );

    expect((updData as any)?.updateOrderStatus?.status).toBe('PROCESSING');

    const getData = await api.exec(
      { query: GET_ORDER, variables: { id: orderId } },
      defaultMerchantAuth,
    );

    expect((getData as any)?.order?.status).toBe('PROCESSING');
  });
});
