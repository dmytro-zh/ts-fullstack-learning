// apps/api/src/__tests__/integration/order.service.integration.test.ts
import { describe, it, expect } from 'vitest';
import { OrderService } from '../../services/order.service';
import { prismaTest } from './db';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { ERROR_CODES } from '../../errors/codes';

function ctx(auth: { userId: string | null; role: any | null }) {
  return { auth } as any;
}

function uniq(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function seedMerchantWithStoreAndProduct(opts?: { ownerId?: string }) {
  const ownerId = opts?.ownerId ?? uniq('merchant');

  // user is not strictly required for OrderService checks (it uses ctx.userId),
  // but creating it keeps DB consistent for future changes.
  await prismaTest.user.create({
    data: {
      email: `${ownerId}@test.dev`,
      role: APP_ROLES.MERCHANT,
    },
  });

  const store = await prismaTest.store.create({
    data: {
      name: `Store ${ownerId}`,
      email: `${ownerId}@store.test.dev`,
      ownerId,
    },
  });

  const product = await prismaTest.product.create({
    data: {
      slug: uniq('p'),
      name: `Product ${ownerId}`,
      price: 9.99,
      quantity: 10,
      inStock: true,
      isActive: true,
      deletedAt: null,
      storeId: store.id,
    },
  });

  return { ownerId, store, product };
}

async function seedOrder(params: { storeId: string | null; productId: string; status: any }) {
  return prismaTest.order.create({
    data: {
      customerName: 'John Doe',
      email: 'john@test.dev',
      total: 19.98,
      status: params.status,
      checkoutLinkId: null,
      storeId: params.storeId,
      productId: params.productId,
      quantity: 2,
      shippingAddress: '1 Test Street',
      shippingNote: null,
    },
  });
}

describe('OrderService (integration)', () => {
  it('getByStore returns only allowed statuses (repo filter) for owned store', async () => {
    const { ownerId, store, product } = await seedMerchantWithStoreAndProduct();

    // These should be excluded by repository filter
    await seedOrder({ storeId: store.id, productId: product.id, status: 'NEW' });
    await seedOrder({ storeId: store.id, productId: product.id, status: 'PENDING_PAYMENT' });

    // These should be included
    const oPaid = await seedOrder({ storeId: store.id, productId: product.id, status: 'PAID' });
    const oCancelled = await seedOrder({
      storeId: store.id,
      productId: product.id,
      status: 'CANCELLED',
    });

    const service = new OrderService();
    const res = await service.getByStore(
      ctx({ userId: ownerId, role: APP_ROLES.MERCHANT }),
      store.id,
    );

    const ids = res.map((o: any) => o.id);

    expect(ids).toContain(oPaid.id);
    expect(ids).toContain(oCancelled.id);

    // ensure filtered ones are not returned
    expect(res.find((o: any) => o.status === 'NEW')).toBeFalsy();
    expect(res.find((o: any) => o.status === 'PENDING_PAYMENT')).toBeFalsy();
  });

  it('getByStore forbids when merchant does not own store', async () => {
    const { store } = await seedMerchantWithStoreAndProduct();
    const otherMerchantId = uniq('other-merchant');

    const service = new OrderService();
    await expect(
      service.getByStore(ctx({ userId: otherMerchantId, role: APP_ROLES.MERCHANT }), store.id),
    ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });
  });

  it('getById returns order when owned, forbids when not owned', async () => {
    const { ownerId, store, product } = await seedMerchantWithStoreAndProduct();

    const order = await seedOrder({ storeId: store.id, productId: product.id, status: 'PAID' });

    const service = new OrderService();

    const ok = await service.getById(ctx({ userId: ownerId, role: APP_ROLES.MERCHANT }), order.id);
    expect(ok?.id).toBe(order.id);

    await expect(
      service.getById(ctx({ userId: uniq('nope'), role: APP_ROLES.MERCHANT }), order.id),
    ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });
  });

  it('getById throws NOT_FOUND when order.storeId is null', async () => {
    const { ownerId, product } = await seedMerchantWithStoreAndProduct();

    const order = await seedOrder({ storeId: null, productId: product.id, status: 'PAID' });

    const service = new OrderService();

    await expect(
      service.getById(ctx({ userId: ownerId, role: APP_ROLES.MERCHANT }), order.id),
    ).rejects.toMatchObject({ code: ERROR_CODES.NOT_FOUND });
  });

  it('updateStatus updates when transition is allowed and owned', async () => {
    const { ownerId, store, product } = await seedMerchantWithStoreAndProduct();

    const order = await seedOrder({ storeId: store.id, productId: product.id, status: 'PAID' });

    const service = new OrderService();

    const updated = await service.updateStatus(
      ctx({ userId: ownerId, role: APP_ROLES.MERCHANT }),
      order.id,
      'PROCESSING',
    );

    expect(updated.id).toBe(order.id);
    expect(updated.status).toBe('PROCESSING');

    const fromDb = await prismaTest.order.findUnique({ where: { id: order.id } });
    expect(fromDb?.status).toBe('PROCESSING');
  });

  it('updateStatus throws INVALID_ORDER_STATUS_TRANSITION on forbidden transition', async () => {
    const { ownerId, store, product } = await seedMerchantWithStoreAndProduct();

    const order = await seedOrder({ storeId: store.id, productId: product.id, status: 'PAID' });

    const service = new OrderService();

    await expect(
      service.updateStatus(
        ctx({ userId: ownerId, role: APP_ROLES.MERCHANT }),
        order.id,
        'COMPLETED',
      ),
    ).rejects.toMatchObject({ code: ERROR_CODES.INVALID_ORDER_STATUS_TRANSITION });
  });

  it('updateStatus forbids when merchant does not own store', async () => {
    const { store, product } = await seedMerchantWithStoreAndProduct();

    const order = await seedOrder({ storeId: store.id, productId: product.id, status: 'PAID' });

    const service = new OrderService();

    await expect(
      service.updateStatus(
        ctx({ userId: uniq('other-merchant'), role: APP_ROLES.MERCHANT }),
        order.id,
        'PROCESSING',
      ),
    ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });
  });
});
