import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createApolloServer } from '../server';
import { prisma } from '../lib/prisma';

const ADD_PRODUCT = `
  mutation AddProduct($n:String!,$p:Float!,$s:Boolean!){
    addProduct(name:$n, price:$p, inStock:$s){ id name }
  }
`;
const ADD_CART = `
  mutation AddCart($id:ID!,$q:Int!){
    addCartItem(productId:$id, quantity:$q){ id }
  }
`;
const CART_ITEMS = `{ cartItems { id } }`;
const CHECKOUT = `
  mutation Checkout($name:String!,$email:String!){
    checkout(input:{ customerName:$name, email:$email }) {
      id
      total
    }
  }
`;

describe('Checkout GraphQL flow', () => {
  const server = createApolloServer();
  let productId: string = '';

  beforeAll(async () => {
    await server.start();
    const name = `Test ${Date.now()}`;
    const addProductRes = await server.executeOperation({
      query: ADD_PRODUCT,
      variables: { n: name, p: 9.99, s: true },
    });
    if (addProductRes.body.kind !== 'single' || !addProductRes.body.singleResult.data) {
      throw new Error('Unexpected addProduct response');
    }
    const addProductData = addProductRes.body.singleResult.data as {
      addProduct?: { id: string };
    };
    productId = addProductData.addProduct?.id ?? '';

    await server.executeOperation({
      query: ADD_CART,
      variables: { id: productId, q: 2 },
    });
  });

  afterAll(async () => {
    await prisma.cartItem.deleteMany({ where: { productId } }).catch(() => {});
    await prisma.orderItem.deleteMany({ where: { productId } }).catch(() => {});
    await prisma.order
      .deleteMany({ where: { customerName: { startsWith: 'Test ' } } })
      .catch(() => {});
    await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
    await server.stop();
    await prisma.$disconnect().catch(() => {});
  });

  it('@smoke checkout creates order and clears cart', async () => {
    const checkoutRes = await server.executeOperation({
      query: CHECKOUT,
      variables: { name: 'Test Buyer', email: 'buyer@example.com' },
    });

    if (checkoutRes.body.kind !== 'single' || !checkoutRes.body.singleResult.data) {
      throw new Error('Unexpected checkout response');
    }
    const checkoutData = checkoutRes.body.singleResult.data as {
      checkout?: { id: string; total: number };
    };
    expect(checkoutData.checkout?.id).toBeTruthy();
    expect(checkoutData.checkout?.total).toBeGreaterThan(0);

    const cartAfter = await server.executeOperation({ query: CART_ITEMS });
    if (cartAfter.body.kind !== 'single' || !cartAfter.body.singleResult.data) {
      throw new Error('Unexpected cart response');
    }
    const cartData = cartAfter.body.singleResult.data as { cartItems?: { id: string }[] };
    expect(cartData.cartItems?.length ?? 0).toBe(0);
  });
});
