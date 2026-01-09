import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { DomainError } from '../errors/domain-error';
import { ERROR_CODES } from '../errors/codes';

// 1) HOISTED mocks - must be defined before vi.mock factories run
const mocks = vi.hoisted(() => {
  return {
    checkoutLinkRepo: {
      create: vi.fn(),
      findBySlug: vi.fn(),
      update: vi.fn(),
    },
    productRepo: {
      findById: vi.fn(),
    },
    prisma: {
      store: {
        findFirst: vi.fn(),
      },
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
  }
  return { CheckoutLinkRepository };
});

vi.mock('../repositories/product.repository', () => {
  class ProductRepository {
    findById = mocks.productRepo.findById;
  }
  return { ProductRepository };
});

vi.mock('../lib/prisma', () => {
  return { prisma: mocks.prisma };
});

// 3) Import service AFTER mocks are declared
import { CheckoutLinkService } from './checkout-link.service';

const checkoutLinkRepoMock = mocks.checkoutLinkRepo;
const productRepoMock = mocks.productRepo;
const prismaMock = mocks.prisma;

function ctx(auth: { userId: string | null; role: any | null }) {
  return { auth } as any;
}

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
