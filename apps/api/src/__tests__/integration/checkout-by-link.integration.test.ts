import { describe, it, expect } from 'vitest';
import { prismaTest } from './db';
import { CheckoutLinkService } from '../../services/checkout-link.service';
import { ERROR_CODES } from '../../errors/codes';

function uniq(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function seedStoreProductLink(params?: {
  productIsActive?: boolean;
  productDeletedAt?: Date | null;
  linkActive?: boolean;
  quantity?: number;
  price?: number;
}) {
  const ownerId = uniq('owner');

  const store = await prismaTest.store.create({
    data: {
      name: 'Test Store',
      email: `${uniq('store')}@test.dev`,
      ownerId,
    },
  });

  const quantity = params?.quantity ?? 10;
  const price = params?.price ?? 9.99;

  const product = await prismaTest.product.create({
    data: {
      slug: uniq('product'),
      name: `Product ${Date.now()}`,
      price,
      quantity,
      inStock: quantity > 0,
      isActive: params?.productIsActive ?? true,
      deletedAt: params?.productDeletedAt ?? null,
      storeId: store.id,
    },
  });

  const link = await prismaTest.checkoutLink.create({
    data: {
      slug: uniq('link'),
      active: params?.linkActive ?? true,
      productId: product.id,
      storeId: store.id,
    },
  });

  return { ownerId, store, product, link };
}

describe('CheckoutLinkService (integration) - checkoutByLink', () => {
  it('creates an order and decrements product quantity', async () => {
    const { store, product, link } = await seedStoreProductLink({ quantity: 10, price: 9.99 });

    const service = new CheckoutLinkService();

    const input = {
      slug: link.slug,
      customerName: 'John Doe',
      email: 'john@test.dev',
      quantity: 2,
      shippingAddress: 'Toronto, ON',
      shippingNote: 'Leave at door',
    };

    const order = await service.checkoutByLink(input as any);

    expect(order.productId).toBe(product.id);
    expect(order.storeId).toBe(store.id);
    expect(order.checkoutLinkId).toBe(link.id);

    expect(order.customerName).toBe(input.customerName);
    expect(order.email).toBe(input.email);
    expect(order.quantity).toBe(input.quantity);
    expect(order.shippingAddress).toBe(input.shippingAddress);

    expect(Number(order.total)).toBeCloseTo(product.price * input.quantity, 5);

    const fromDb = await prismaTest.order.findUnique({ where: { id: order.id } });
    expect(fromDb).toBeTruthy();

    const updatedProduct = await prismaTest.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.quantity).toBe(8);
    expect(updatedProduct?.inStock).toBe(true);
  });

  it('sets inStock=false when quantity becomes 0', async () => {
    const { product, link } = await seedStoreProductLink({ quantity: 2 });

    const service = new CheckoutLinkService();

    await service.checkoutByLink({
      slug: link.slug,
      customerName: 'John',
      email: 'john@test.dev',
      quantity: 2,
      shippingAddress: 'Somewhere',
    } as any);

    const updated = await prismaTest.product.findUnique({ where: { id: product.id } });
    expect(updated?.quantity).toBe(0);
    expect(updated?.inStock).toBe(false);
  });

  it('rejects when link is inactive', async () => {
    const { link } = await seedStoreProductLink({ linkActive: false });

    const service = new CheckoutLinkService();

    await expect(
      service.checkoutByLink({
        slug: link.slug,
        customerName: 'John',
        email: 'john@test.dev',
        quantity: 1,
        shippingAddress: 'Somewhere',
      } as any),
    ).rejects.toMatchObject({
      code: ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
      field: 'slug',
    });
  });

  it('rejects when link does not exist', async () => {
    const service = new CheckoutLinkService();

    await expect(
      service.checkoutByLink({
        slug: 'missing-slug',
        customerName: 'John',
        email: 'john@test.dev',
        quantity: 1,
        shippingAddress: 'Somewhere',
      } as any),
    ).rejects.toMatchObject({
      code: ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
      field: 'slug',
    });
  });

  it('rejects when product is inactive (isActive=false)', async () => {
    const { link } = await seedStoreProductLink({ productIsActive: false });

    const service = new CheckoutLinkService();

    await expect(
      service.checkoutByLink({
        slug: link.slug,
        customerName: 'John',
        email: 'john@test.dev',
        quantity: 1,
        shippingAddress: 'Somewhere',
      } as any),
    ).rejects.toMatchObject({
      code: ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
      field: 'slug',
    });
  });

  it('rejects invalid quantity (0) - zod validation', async () => {
    const { link } = await seedStoreProductLink();

    const service = new CheckoutLinkService();

    await expect(
      service.checkoutByLink({
        slug: link.slug,
        customerName: 'John',
        email: 'john@test.dev',
        quantity: 0,
        shippingAddress: 'Somewhere',
      } as any),
    ).rejects.toMatchObject({ name: 'ZodError' });
  });

  it('rejects when quantity exceeds available stock', async () => {
    const { link } = await seedStoreProductLink({ quantity: 1 });

    const service = new CheckoutLinkService();

    await expect(
      service.checkoutByLink({
        slug: link.slug,
        customerName: 'John',
        email: 'john@test.dev',
        quantity: 2,
        shippingAddress: 'Somewhere',
      } as any),
    ).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_CHECKOUT_INPUT,
      field: 'quantity',
    });
  });
});
