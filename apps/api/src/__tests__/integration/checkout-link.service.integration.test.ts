import { describe, it, expect } from 'vitest';
import { CheckoutLinkService } from '../../services/checkout-link.service';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { prismaTest } from './db';

function ctx(auth: { userId: string | null; role: any | null }) {
  return { auth } as any;
}

function uniq(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function seedStoreAndProduct(ownerId: string) {
  const store = await prismaTest.store.create({
    data: {
      name: 'Test Store',
      email: 'store@test.dev',
      ownerId,
    },
  });

  const product = await prismaTest.product.create({
    data: {
      slug: uniq('p'),
      name: `Product ${Date.now()}`,
      price: 9.99,
      quantity: 10,
      inStock: true,
      isActive: true,
      deletedAt: null,
      storeId: store.id,
    },
  });

  return { store, product };
}

describe('CheckoutLinkService (integration) - createLink', () => {
  it('creates a new checkout link for owned store', async () => {
    const ownerId = 'owner_1';
    const { store, product } = await seedStoreAndProduct(ownerId);

    const service = new CheckoutLinkService();

    const slug = uniq('my-link');
    const link = await service.createLink(ctx({ userId: ownerId, role: APP_ROLES.MERCHANT }), {
      slug,
      productId: product.id,
    });

    expect(link.slug).toBe(slug);
    expect(link.active).toBe(true);
    expect(link.productId).toBe(product.id);
    expect(link.storeId).toBe(store.id);

    const fromDb = await prismaTest.checkoutLink.findUnique({ where: { slug } });
    expect(fromDb).toBeTruthy();
    expect(fromDb?.productId).toBe(product.id);
    expect(fromDb?.storeId).toBe(store.id);
  });

  it('returns existing active link when slug exists for same product and store', async () => {
    const ownerId = 'owner_1';
    const { store, product } = await seedStoreAndProduct(ownerId);

    const slug = uniq('same-slug');

    await prismaTest.checkoutLink.create({
      data: {
        slug,
        active: true,
        productId: product.id,
        storeId: store.id,
      },
    });

    const service = new CheckoutLinkService();

    const link = await service.createLink(ctx({ userId: ownerId, role: APP_ROLES.MERCHANT }), {
      slug,
      productId: product.id,
    });

    expect(link.slug).toBe(slug);
    expect(link.active).toBe(true);
    expect(link.productId).toBe(product.id);
    expect(link.storeId).toBe(store.id);
  });

  it('reactivates existing inactive link when slug exists for same product and store', async () => {
    const ownerId = 'owner_1';
    const { store, product } = await seedStoreAndProduct(ownerId);

    const slug = uniq('inactive-slug');

    const existing = await prismaTest.checkoutLink.create({
      data: {
        slug,
        active: false,
        productId: product.id,
        storeId: store.id,
      },
    });

    const service = new CheckoutLinkService();

    const link = await service.createLink(ctx({ userId: ownerId, role: APP_ROLES.MERCHANT }), {
      slug,
      productId: product.id,
    });

    expect(link.id).toBe(existing.id);
    expect(link.active).toBe(true);

    const fromDb = await prismaTest.checkoutLink.findUnique({ where: { id: existing.id } });
    expect(fromDb?.active).toBe(true);
  });

  it('throws when slug is taken by different product', async () => {
    const ownerId = 'owner_1';
    const { store, product } = await seedStoreAndProduct(ownerId);

    const otherProduct = await prismaTest.product.create({
      data: {
        slug: uniq('p2'),
        name: `Product2 ${Date.now()}`,
        price: 19.99,
        quantity: 5,
        inStock: true,
        isActive: true,
        deletedAt: null,
        storeId: store.id,
      },
    });

    const slug = uniq('taken');

    await prismaTest.checkoutLink.create({
      data: {
        slug,
        active: true,
        productId: otherProduct.id,
        storeId: store.id,
      },
    });

    const service = new CheckoutLinkService();

    await expect(
      service.createLink(ctx({ userId: ownerId, role: APP_ROLES.MERCHANT }), {
        slug,
        productId: product.id,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CHECKOUT_INPUT' });
  });

  it('forbids BUYER to create a checkout link', async () => {
    const ownerId = 'owner_1';
    const { product } = await seedStoreAndProduct(ownerId);

    const service = new CheckoutLinkService();

    await expect(
      service.createLink(ctx({ userId: ownerId, role: APP_ROLES.BUYER }), {
        slug: uniq('nope'),
        productId: product.id,
      }),
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('forbids MERCHANT when store is not owned by user', async () => {
    const ownerId = 'owner_1';
    const { product } = await seedStoreAndProduct(ownerId);

    const service = new CheckoutLinkService();

    await expect(
      service.createLink(ctx({ userId: 'other-owner', role: APP_ROLES.MERCHANT }), {
        slug: uniq('no-access'),
        productId: product.id,
      }),
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('allows PLATFORM_OWNER to create link for any store', async () => {
    const ownerId = 'platform-owner';
    const { store, product } = await seedStoreAndProduct('merchant-owner');

    const service = new CheckoutLinkService();

    const slug = uniq('owner-link');
    const link = await service.createLink(
      ctx({ userId: ownerId, role: APP_ROLES.PLATFORM_OWNER }),
      { slug, productId: product.id },
    );

    expect(link.slug).toBe(slug);
    expect(link.storeId).toBe(store.id);
  });
});
