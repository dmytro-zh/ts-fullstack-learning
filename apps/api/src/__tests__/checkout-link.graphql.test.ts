import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createApolloServer } from '../server';
import { prisma } from '../lib/prisma';

const CREATE_STORE = `
  mutation CreateStore($input: StoreInput!) {
    createStore(input: $input) { id name email }
  }
`;
const ADD_PRODUCT = `
  mutation AddProduct($name:String!, $price:Float!, $inStock:Boolean!, $storeId:ID) {
    addProduct(name:$name, price:$price, inStock:$inStock, storeId:$storeId) { id name }
  }
`;
const CREATE_LINK = `
  mutation CreateCheckoutLink($input: CheckoutLinkInput!) {
    createCheckoutLink(input:$input) { id slug product { id name } store { id name } active }
  }
`;
const GET_LINK = `
  query CheckoutLink($slug:String!) {
    checkoutLink(slug:$slug) { id slug active product { id name price } store { id name email } }
  }
`;

describe('CheckoutLink GraphQL flow', () => {
  const server = createApolloServer();
  const slug = `test-slug-${Date.now()}`;
  const storeName = `Test Store ${Date.now()}`;
  const productName = `Test CL ${Date.now()}`;
  let storeId = '';
  let productId = '';

  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    await prisma.checkoutLink.deleteMany({ where: { slug: { startsWith: 'test-slug-' } } }).catch(() => {});
    await prisma.product.deleteMany({ where: { name: { startsWith: 'Test CL ' } } }).catch(() => {});
    await prisma.store.deleteMany({ where: { name: { startsWith: 'Test Store ' } } }).catch(() => {});
    await server.stop();
    await prisma.$disconnect().catch(() => {});
  });

  it('@smoke create + fetch checkout link', async () => {
    const storeRes = await server.executeOperation({
      query: CREATE_STORE,
      variables: { input: { name: storeName, email: 'store@example.com' } },
    });
    const storeData = storeRes.body.kind === 'single' ? storeRes.body.singleResult.data : null;
    storeId = (storeData as any)?.createStore?.id;
    expect(storeId).toBeTruthy();

    const productRes = await server.executeOperation({
      query: ADD_PRODUCT,
      variables: { name: productName, price: 9.99, inStock: true, storeId },
    });
    const productData = productRes.body.kind === 'single' ? productRes.body.singleResult.data : null;
    productId = (productData as any)?.addProduct?.id;
    expect(productId).toBeTruthy();

    const linkRes = await server.executeOperation({
      query: CREATE_LINK,
      variables: { input: { slug, productId, storeId } },
    });
    const linkData = linkRes.body.kind === 'single' ? linkRes.body.singleResult.data : null;
    expect((linkData as any)?.createCheckoutLink?.slug).toBe(slug);

    const getRes = await server.executeOperation({ query: GET_LINK, variables: { slug } });
    const fetched = getRes.body.kind === 'single' ? getRes.body.singleResult.data : null;
    expect((fetched as any)?.checkoutLink?.product?.id).toBe(productId);
    expect((fetched as any)?.checkoutLink?.store?.id).toBe(storeId);
  });
});
