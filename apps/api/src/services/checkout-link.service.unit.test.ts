import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APP_PLANS, APP_ROLES, FREE_PLAN_LIMITS } from '@ts-fullstack-learning/shared';
import { DomainError } from '../errors/domain-error';
import { ERROR_CODES } from '../errors/codes';

// 1) HOISTED mocks - must be defined before vi.mock factories run
const mocks = vi.hoisted(() => {
  return {
    checkoutLinkRepo: {
      create: vi.fn(),
      findBySlug: vi.fn(),
      update: vi.fn(),
      countByOwner: vi.fn(),
    },
    productRepo: {
      findById: vi.fn(),
    },
    storeRepo: {
      findByIdForOwner: vi.fn(),
    },
    userRepo: {
      getBillingForUser: vi.fn(),
    },
    prisma: {
      $transaction: vi.fn(),
    },
  };
});

// 2) Module mocks use hoisted refs
vi.mock('../repositories/checkout-link.repository', () => {
  class CheckoutLinkRepository {
    create = mocks.checkoutLinkRepo.create;
    findBySlug = mocks.checkoutLinkRepo.findBySlug;
    update = mocks.checkoutLinkRepo.update;
    countByOwner = mocks.checkoutLinkRepo.countByOwner;
  }
  return { CheckoutLinkRepository };
});

vi.mock('../repositories/product.repository', () => {
  class ProductRepository {
    findById = mocks.productRepo.findById;
  }
  return { ProductRepository };
});

vi.mock('../repositories/store.repository', () => {
  class StoreRepository {
    findByIdForOwner = mocks.storeRepo.findByIdForOwner;
  }
  return { StoreRepository };
});

vi.mock('../repositories/user.repository', () => {
  class UserRepository {
    getBillingForUser = mocks.userRepo.getBillingForUser;
  }
  return { UserRepository };
});

vi.mock('../lib/prisma', () => {
  return { prisma: mocks.prisma };
});

// 3) Import service AFTER mocks are declared
import { CheckoutLinkService } from './checkout-link.service';

const checkoutLinkRepoMock = mocks.checkoutLinkRepo;
const productRepoMock = mocks.productRepo;
const storeRepoMock = mocks.storeRepo;
const userRepoMock = mocks.userRepo;
const prismaMock = mocks.prisma;

function ctx(auth: { userId: string | null; role: any | null }) {
  return { auth } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  checkoutLinkRepoMock.countByOwner.mockResolvedValue(0);
  userRepoMock.getBillingForUser.mockResolvedValue({ plan: APP_PLANS.PRO });
});

describe('checkoutByLink', () => {
  let lastTx: any;

  beforeEach(() => {
    lastTx = undefined;
  });

  it('throws CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE when link missing', async () => {
    prismaMock.$transaction.mockImplementationOnce(async (fn: any) => {
      lastTx = {
        checkoutLink: { findUnique: vi.fn().mockResolvedValueOnce(null) },
      };
      return fn(lastTx);
    });

    const service = new CheckoutLinkService();
    await expect(
      service.checkoutByLink({
        slug: 'slug',
        customerName: 'John',
        email: 'john@test.com',
        quantity: 1,
        shippingAddress: '123 Main St',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
      field: 'slug',
    });
  });

  it('throws CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE when product is inactive', async () => {
    prismaMock.$transaction.mockImplementationOnce(async (fn: any) => {
      lastTx = {
        checkoutLink: {
          findUnique: vi.fn().mockResolvedValueOnce({
            id: 'l1',
            active: true,
            storeId: 's1',
            product: { id: 'p1', price: 10, quantity: 1, isActive: false, deletedAt: null },
          }),
        },
      };
      return fn(lastTx);
    });

    const service = new CheckoutLinkService();
    await expect(
      service.checkoutByLink({
        slug: 'slug',
        customerName: 'John',
        email: 'john@test.com',
        quantity: 1,
        shippingAddress: '123 Main St',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
      field: 'slug',
    });
  });

  it('throws INVALID_CHECKOUT_INPUT when out of stock', async () => {
    prismaMock.$transaction.mockImplementationOnce(async (fn: any) => {
      lastTx = {
        checkoutLink: {
          findUnique: vi.fn().mockResolvedValueOnce({
            id: 'l1',
            active: true,
            storeId: 's1',
            product: { id: 'p1', price: 10, quantity: 1 },
          }),
        },
      };
      return fn(lastTx);
    });

    const service = new CheckoutLinkService();
    await expect(
      service.checkoutByLink({
        slug: 'slug',
        customerName: 'John',
        email: 'john@test.com',
        quantity: 2,
        shippingAddress: '123 Main St',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_CHECKOUT_INPUT,
      field: 'quantity',
    });
  });

  it('creates order with null storeId and shippingNote when missing', async () => {
    prismaMock.$transaction.mockImplementationOnce(async (fn: any) => {
      lastTx = {
        checkoutLink: {
          findUnique: vi.fn().mockResolvedValueOnce({
            id: 'l1',
            active: true,
            storeId: null,
            product: { id: 'p1', price: 10, quantity: 2 },
          }),
        },
        product: {
          update: vi.fn().mockResolvedValueOnce({ id: 'p1' }),
        },
        order: {
          create: vi.fn().mockResolvedValueOnce({ id: 'o1' }),
        },
      };

      return fn(lastTx);
    });

    const service = new CheckoutLinkService();
    await service.checkoutByLink({
      slug: 'slug',
      customerName: 'John',
      email: 'john@test.com',
      quantity: 1,
      shippingAddress: '123 Main St',
    });

    expect(lastTx.order.create).toHaveBeenCalledWith({
      data: {
        customerName: 'John',
        email: 'john@test.com',
        quantity: 1,
        total: 10,
        shippingAddress: '123 Main St',
        shippingNote: null,
        status: 'PAID',
        checkoutLinkId: 'l1',
        storeId: null,
        productId: 'p1',
      },
      include: { product: true },
    });
  });

  it('creates order and updates inventory on success', async () => {
    prismaMock.$transaction.mockImplementationOnce(async (fn: any) => {
      lastTx = {
        checkoutLink: {
          findUnique: vi.fn().mockResolvedValueOnce({
            id: 'l1',
            active: true,
            storeId: 's1',
            product: { id: 'p1', price: 12, quantity: 5 },
          }),
        },
        product: {
          update: vi.fn().mockResolvedValueOnce({ id: 'p1' }),
        },
        order: {
          create: vi.fn().mockResolvedValueOnce({ id: 'o1' }),
        },
      };

      return fn(lastTx);
    });

    const service = new CheckoutLinkService();
    await service.checkoutByLink({
      slug: 'slug',
      customerName: 'John',
      email: 'john@test.com',
      quantity: 2,
      shippingAddress: '123 Main St',
      shippingNote: 'Leave at door',
    });

    expect(lastTx.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { quantity: 3, inStock: true },
    });

    expect(lastTx.order.create).toHaveBeenCalledWith({
      data: {
        customerName: 'John',
        email: 'john@test.com',
        quantity: 2,
        total: 24,
        shippingAddress: '123 Main St',
        shippingNote: 'Leave at door',
        status: 'PAID',
        checkoutLinkId: 'l1',
        storeId: 's1',
        productId: 'p1',
      },
      include: { product: true },
    });
  });
});

describe('createLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forbids non-merchant roles', async () => {
    const service = new CheckoutLinkService();

    await expect(
      service.createLink(ctx({ userId: 'u1', role: APP_ROLES.BUYER }), {
        slug: 'nope',
        productId: 'p1',
      }),
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('forbids missing userId', async () => {
    const service = new CheckoutLinkService();

    await expect(
      service.createLink(ctx({ userId: null, role: APP_ROLES.MERCHANT }), {
        slug: 'nope',
        productId: 'p1',
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });

    expect(productRepoMock.findById).not.toHaveBeenCalled();
  });

  it('throws when product is not found', async () => {
    productRepoMock.findById.mockResolvedValueOnce(null);
    const service = new CheckoutLinkService();

    await expect(
      service.createLink(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), {
        slug: 'missing-product',
        productId: 'p1',
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.PRODUCT_NOT_FOUND });
  });

  it('throws when product has no storeId', async () => {
    productRepoMock.findById.mockResolvedValueOnce({ id: 'p1', storeId: null });
    const service = new CheckoutLinkService();

    await expect(
      service.createLink(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), {
        slug: 'no-store',
        productId: 'p1',
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.NOT_FOUND });
  });

  it('throws when storeId does not match product', async () => {
    productRepoMock.findById.mockResolvedValueOnce({ id: 'p1', storeId: 's1' });
    const service = new CheckoutLinkService();

    await expect(
      service.createLink(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), {
        slug: 'bad-store',
        productId: 'p1',
        storeId: 's2',
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.INVALID_CHECKOUT_INPUT });
  });

  it('forbids merchant when store is not owned', async () => {
    productRepoMock.findById.mockResolvedValueOnce({ id: 'p1', storeId: 's1' });
    storeRepoMock.findByIdForOwner.mockResolvedValueOnce(null);
    const service = new CheckoutLinkService();

    await expect(
      service.createLink(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), {
        slug: 'no-access',
        productId: 'p1',
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });

    expect(storeRepoMock.findByIdForOwner).toHaveBeenCalledWith('s1', 'u1');
  });

  it('forbids when FREE plan hits checkout link limit', async () => {
    productRepoMock.findById.mockResolvedValueOnce({ id: 'p1', storeId: 's1' });
    storeRepoMock.findByIdForOwner.mockResolvedValueOnce({ id: 's1' });
    userRepoMock.getBillingForUser.mockResolvedValueOnce({ plan: APP_PLANS.FREE });
    checkoutLinkRepoMock.countByOwner.mockResolvedValueOnce(FREE_PLAN_LIMITS.checkoutLinks);
    const service = new CheckoutLinkService();

    await expect(
      service.createLink(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), {
        slug: 'limit-hit',
        productId: 'p1',
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.PLAN_LIMIT_EXCEEDED });

    expect(checkoutLinkRepoMock.create).not.toHaveBeenCalled();
  });

  it('forbids when PRO subscription is past due', async () => {
    productRepoMock.findById.mockResolvedValueOnce({ id: 'p1', storeId: 's1' });
    storeRepoMock.findByIdForOwner.mockResolvedValueOnce({ id: 's1' });
    userRepoMock.getBillingForUser.mockResolvedValueOnce({
      plan: APP_PLANS.PRO,
      subscriptionStatus: 'PAST_DUE',
    });

    const service = new CheckoutLinkService();

    await expect(
      service.createLink(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), {
        slug: 'past-due',
        productId: 'p1',
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.SUBSCRIPTION_INACTIVE });

    expect(checkoutLinkRepoMock.create).not.toHaveBeenCalled();
  });

  it('returns existing active link for same product/store', async () => {
    productRepoMock.findById.mockResolvedValueOnce({ id: 'p1', storeId: 's1' });
    storeRepoMock.findByIdForOwner.mockResolvedValueOnce({ id: 's1' });
    checkoutLinkRepoMock.findBySlug.mockResolvedValueOnce({
      id: 'l1',
      productId: 'p1',
      storeId: 's1',
      active: true,
    });

    const service = new CheckoutLinkService();
    const link = await service.createLink(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), {
      slug: 'existing',
      productId: 'p1',
    });

    expect(link).toMatchObject({ id: 'l1', active: true });
    expect(checkoutLinkRepoMock.update).not.toHaveBeenCalled();
  });

  it('reactivates existing inactive link for same product/store', async () => {
    productRepoMock.findById.mockResolvedValueOnce({ id: 'p1', storeId: 's1' });
    storeRepoMock.findByIdForOwner.mockResolvedValueOnce({ id: 's1' });
    checkoutLinkRepoMock.findBySlug.mockResolvedValueOnce({
      id: 'l1',
      productId: 'p1',
      storeId: 's1',
      active: false,
    });
    checkoutLinkRepoMock.update.mockResolvedValueOnce({ id: 'l1', active: true });

    const service = new CheckoutLinkService();
    const link = await service.createLink(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), {
      slug: 'inactive',
      productId: 'p1',
    });

    expect(checkoutLinkRepoMock.update).toHaveBeenCalledWith('l1', { active: true });
    expect(link).toMatchObject({ id: 'l1', active: true });
  });

  it('throws when slug is taken by different product', async () => {
    productRepoMock.findById.mockResolvedValueOnce({ id: 'p1', storeId: 's1' });
    storeRepoMock.findByIdForOwner.mockResolvedValueOnce({ id: 's1' });
    checkoutLinkRepoMock.findBySlug.mockResolvedValueOnce({
      id: 'l1',
      productId: 'p2',
      storeId: 's1',
      active: true,
    });

    const service = new CheckoutLinkService();
    await expect(
      service.createLink(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), {
        slug: 'taken',
        productId: 'p1',
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.INVALID_CHECKOUT_INPUT });
  });

  it('throws when slug is taken by same product but different store', async () => {
    productRepoMock.findById.mockResolvedValueOnce({ id: 'p1', storeId: 's1' });
    storeRepoMock.findByIdForOwner.mockResolvedValueOnce({ id: 's1' });
    checkoutLinkRepoMock.findBySlug.mockResolvedValueOnce({
      id: 'l1',
      productId: 'p1',
      storeId: 's2',
      active: true,
    });

    const service = new CheckoutLinkService();
    await expect(
      service.createLink(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), {
        slug: 'taken',
        productId: 'p1',
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.INVALID_CHECKOUT_INPUT });
  });

  it('allows PLATFORM_OWNER without ownership check', async () => {
    productRepoMock.findById.mockResolvedValueOnce({ id: 'p1', storeId: 's1' });
    checkoutLinkRepoMock.findBySlug.mockResolvedValueOnce(null);
    checkoutLinkRepoMock.create.mockResolvedValueOnce({
      id: 'l1',
      slug: 'owner-link',
      productId: 'p1',
      storeId: 's1',
    });

    const service = new CheckoutLinkService();
    const link = await service.createLink(
      ctx({ userId: 'owner-1', role: APP_ROLES.PLATFORM_OWNER }),
      {
        slug: 'owner-link',
        productId: 'p1',
      },
    );

    expect(storeRepoMock.findByIdForOwner).not.toHaveBeenCalled();
    expect(link).toMatchObject({ id: 'l1' });
  });
});

describe('getBySlug', () => {
  it('returns repo result', async () => {
    checkoutLinkRepoMock.findBySlug.mockResolvedValueOnce({ id: 'l1' });
    const service = new CheckoutLinkService();

    const res = await service.getBySlug('slug-1');
    expect(res).toEqual({ id: 'l1' });
  });
});
