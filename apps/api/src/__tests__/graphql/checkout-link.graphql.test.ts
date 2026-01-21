import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prismaTest as prisma } from '../integration/db';
import { createTestApolloServer, defaultMerchantAuth, ensureTestUser } from '../helpers/apollo';

const CREATE_STORE = `
  mutation CreateStore($input: StoreInput!) {
    createStore(input: $input) { id name email }
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
      product { id name }
      store { id name }
      active
    }
  }
`;

const GET_LINK = `
  query CheckoutLink($slug:String!) {
    checkoutLink(slug:$slug) {
      id
      slug
      active
      product { id name price }
      store { id name email }
    }
  }
`;

describe('CheckoutLink GraphQL flow', () => {
  const slug = `test-slug-${Date.now()}`;
  const storeName = `Test Store ${Date.now()}`;
  const productName = `Test CL ${Date.now()}`;

  let api: Awaited<ReturnType<typeof createTestApolloServer>>;
  let storeId: string | null = null;
  let productId: string | null = null;
  let checkoutLinkId: string | null = null;

  beforeAll(async () => {
    api = await createTestApolloServer();
    await ensureTestUser(defaultMerchantAuth);
  });

  afterAll(async () => {
    if (checkoutLinkId) {
      await prisma.order.deleteMany({ where: { checkoutLinkId } }).catch(() => {});
      await prisma.checkoutLink.deleteMany({ where: { id: checkoutLinkId } }).catch(() => {});
    }

    if (productId) {
      await prisma.cartItem.deleteMany({ where: { productId } }).catch(() => {});
      await prisma.productImage.deleteMany({ where: { productId } }).catch(() => {});
      await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
    }

    if (storeId) {
      await prisma.order.deleteMany({ where: { storeId } }).catch(() => {});
      await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
    }

    await api.stop();
  });

  it('@smoke create + fetch checkout link', async () => {
    const storeData = await api.exec(
      {
        query: CREATE_STORE,
        variables: { input: { name: storeName, email: 'store@example.com' } },
      },
      defaultMerchantAuth,
    );

    storeId = (storeData as any)?.createStore?.id ?? null;
    expect(storeId).toBeTruthy();

    const productData = await api.exec(
      {
        query: ADD_PRODUCT,
        variables: { name: productName, price: 9.99, storeId, quantity: 3 },
      },
      defaultMerchantAuth,
    );

    productId = (productData as any)?.addProduct?.id ?? null;
    expect(productId).toBeTruthy();

    const linkData = await api.exec(
      {
        query: CREATE_LINK,
        variables: { input: { slug, productId, storeId } },
      },
      defaultMerchantAuth,
    );

    checkoutLinkId = (linkData as any)?.createCheckoutLink?.id ?? null;
    expect((linkData as any)?.createCheckoutLink?.slug).toBe(slug);

    const fetchedData = await api.exec(
      {
        query: GET_LINK,
        variables: { slug },
      },
      defaultMerchantAuth,
    );

    expect((fetchedData as any)?.checkoutLink?.product?.id).toBe(productId);
    expect((fetchedData as any)?.checkoutLink?.store?.id).toBe(storeId);
  });
});
