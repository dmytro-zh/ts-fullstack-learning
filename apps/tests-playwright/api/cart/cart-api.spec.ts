import { test, expect } from '@playwright/test';
import { prisma } from '../../../../apps/api/src/lib/prisma';

const URL = process.env.API_URL ?? 'http://localhost:4000/';

async function cleanupTestProducts() {
  // Remove cart items and products created by API tests (names start with "Test ").
  await prisma.cartItem.deleteMany({ where: { product: { name: { startsWith: 'Test ' } } } });
  await prisma.product.deleteMany({ where: { name: { startsWith: 'Test ' } } });
}

test.beforeEach(async () => {
  await cleanupTestProducts();
});

test.afterAll(async () => {
  await cleanupTestProducts();
  await prisma.$disconnect().catch(() => {});
});

test('@smoke api cart flow', async ({ request }) => {
  // 1) addProduct
  const name = `Test ${Date.now()}`;
  const addProduct = await request.post(URL, {
    headers: { 'content-type': 'application/json' },
    data: {
      query: 'mutation ($n:String!,$p:Float!,$s:Boolean!){ addProduct(name:$n, price:$p, inStock:$s){ id name } }',
      variables: { n: name, p: 9.99, s: true },
    },
  });
  const productId = (await addProduct.json()).data.addProduct.id;
  expect(productId).toBeTruthy();

  // 2) addCartItem
  const addCart = await request.post(URL, {
    headers: { 'content-type': 'application/json' },
    data: {
      query: 'mutation ($id:ID!,$q:Int!){ addCartItem(productId:$id, quantity:$q){ id quantity product { id } } }',
      variables: { id: productId, q: 2 },
    },
  });
  const cartItemId = (await addCart.json()).data.addCartItem.id;
  expect(cartItemId).toBeTruthy();

  // 3) cartItems includes item
  const list = await request.post(URL, {
    headers: { 'content-type': 'application/json' },
    data: { query: '{ cartItems { id quantity product { id } } }' },
  });
  const items = (await list.json()).data.cartItems;
  expect(items.some((i: any) => i.id === cartItemId)).toBe(true);

  // 4) removeCartItem
  const remove = await request.post(URL, {
    headers: { 'content-type': 'application/json' },
    data: { query: 'mutation ($id:ID!){ removeCartItem(id:$id) }', variables: { id: cartItemId } },
  });
  expect((await remove.json()).data.removeCartItem).toBe(true);
});
