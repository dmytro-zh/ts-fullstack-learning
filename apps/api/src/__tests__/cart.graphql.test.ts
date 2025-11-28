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

describe('Cart GraphQL flow', () => {
  const server = createApolloServer();
  let productId: string | undefined;
  let cartItemId: string | undefined;

  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    await prisma.cartItem
      .deleteMany({ where: { productId: productId ?? '' } })
      .catch(() => {});
    await prisma.product.deleteMany({ where: { id: productId ?? '' } }).catch(() => {});
    await server.stop();
    await prisma.$disconnect().catch(() => {});
  });

  it('add -> list -> remove', async () => {
    const uniqueName = `Test Product ${Date.now()}`;

    const addProductRes = await server.executeOperation({
      query: ADD_PRODUCT,
      variables: { name: uniqueName, price: 9.99, inStock: true },
    });
    if (addProductRes.body.kind !== 'single' || !addProductRes.body.singleResult.data) {
      throw new Error('Unexpected addProduct response');
    }
    const addProductData = addProductRes.body.singleResult.data as { addProduct?: { id: string } };
    productId = addProductData.addProduct?.id;
    expect(productId).toBeTruthy();

    const addCartRes = await server.executeOperation({
      query: ADD_CART,
      variables: { productId, qty: 2 },
    });
    if (addCartRes.body.kind !== 'single' || !addCartRes.body.singleResult.data) {
      throw new Error('Unexpected addCart response');
    }
    const addCartData = addCartRes.body.singleResult.data as {
      addCartItem?: { id: string; quantity: number; product: { id: string } };
    };
    cartItemId = addCartData.addCartItem?.id;
    expect(cartItemId).toBeTruthy();
    expect(addCartData.addCartItem?.quantity).toBe(2);
    expect(addCartData.addCartItem?.product.id).toBe(productId);

    const listRes = await server.executeOperation({ query: CART_ITEMS });
    if (listRes.body.kind !== 'single' || !listRes.body.singleResult.data) {
      throw new Error('Unexpected cart list response');
    }
    const items = (listRes.body.singleResult.data as { cartItems?: any[] }).cartItems ?? [];
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: cartItemId,
          quantity: 2,
          product: expect.objectContaining({ id: productId }),
        }),
      ]),
    );

    const removeResRaw = await server.executeOperation({
      query: REMOVE_CART,
      variables: { id: cartItemId },
    });
    if (removeResRaw.body.kind === 'single' && removeResRaw.body.singleResult.data) {
      const removeData = removeResRaw.body.singleResult.data as { removeCartItem?: boolean };
      expect(removeData.removeCartItem).toBe(true);
    }

    const listAfter = await server.executeOperation({ query: CART_ITEMS });
    if (listAfter.body.kind !== 'single' || !listAfter.body.singleResult.data) {
      throw new Error('Unexpected cart list response');
    }
    const itemsAfter = (listAfter.body.singleResult.data as { cartItems?: any[] }).cartItems ?? [];
    expect(itemsAfter.find((i: any) => i.id === cartItemId)).toBeUndefined();
  });
});
