import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createApolloServer } from '../server';
import { prisma } from '../lib/prisma';

const ADD_PRODUCT = `
  mutation AddProduct($name: String!, $price: Float!, $inStock: Boolean!) {
    addProduct(name: $name, price: $price, inStock: $inStock) { id name }
  }
`;

const ADD_CART = `
  mutation AddCart($productId: ID!, $qty: Int!) {
    addCartItem(productId: $productId, quantity: $qty) {
      id
      quantity
      product { id name }
    }
  }
`;

const CART_ITEMS = `
  query CartItems {
    cartItems {
      id
      quantity
      product { id name }
    }
  }
`;

const REMOVE_CART = `
  mutation RemoveCart($id: ID!) {
    removeCartItem(id: $id)
  }
`;

function unwrapSingle(result: any) {
  if (result.body.kind !== 'single') throw new Error('Unexpected result kind');
  return result.body.singleResult;
}

describe('Cart GraphQL flow', () => {
  const server = createApolloServer();
  let productId: string | undefined;
  let cartItemId: string | undefined;

  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    if (cartItemId) {
      await prisma.cartItem.deleteMany({ where: { id: cartItemId } }).catch(() => {});
    }
    if (productId) {
      await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
    }
    await server.stop();
  });

  it('add -> list -> remove', async () => {
    const uniqueName = `Test Product ${Date.now()}`;

    // addProduct
    const addProductRes = unwrapSingle(
      await server.executeOperation({
        query: ADD_PRODUCT,
        variables: { name: uniqueName, price: 9.99, inStock: true },
      }),
    );
    productId = addProductRes.data?.addProduct.id;
    expect(productId).toBeTruthy();

    // addCartItem
    const addCartRes = unwrapSingle(
      await server.executeOperation({
        query: ADD_CART,
        variables: { productId, qty: 2 },
      }),
    );
    cartItemId = addCartRes.data?.addCartItem.id;
    expect(cartItemId).toBeTruthy();
    expect(addCartRes.data?.addCartItem.quantity).toBe(2);
    expect(addCartRes.data?.addCartItem.product.id).toBe(productId);

    // cartItems should include the new item
    const listRes = unwrapSingle(await server.executeOperation({ query: CART_ITEMS }));
    const items = listRes.data?.cartItems ?? [];
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: cartItemId,
          quantity: 2,
          product: expect.objectContaining({ id: productId }),
        }),
      ]),
    );

    // removeCartItem
    const removeRes = unwrapSingle(
      await server.executeOperation({
        query: REMOVE_CART,
        variables: { id: cartItemId },
      }),
    );
    expect(removeRes.data?.removeCartItem).toBe(true);

    // cartItems now empty for that id
    const listAfter = unwrapSingle(await server.executeOperation({ query: CART_ITEMS }));
    const itemsAfter = listAfter.data?.cartItems ?? [];
    expect(itemsAfter.find((i: any) => i.id === cartItemId)).toBeUndefined();
  });
});
