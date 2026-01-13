import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { ProductService } from './product.service';
import { DomainError } from '../errors/domain-error';
import { ERROR_CODES } from '../errors/codes';

vi.mock('../lib/prisma', () => {
  const prisma = {
    $transaction: vi.fn(),
    product: { findFirst: vi.fn(), update: vi.fn() },
    store: { findFirst: vi.fn() },
    checkoutLink: { updateMany: vi.fn() },
  };
  return { prisma };
});

import { prisma } from '../lib/prisma';
import type { GraphQLContext } from '../server-context';

type Repo = {
  findBySlug: (slug: string) => Promise<any>;
  findAllWithStore: () => Promise<any>;
  findByIdWithStore: (id: string) => Promise<any>;
  isStoreOwnedBy: (storeId: string, ownerId: string) => Promise<boolean>;
  create: (data: any) => Promise<any>;
  findById: (id: string) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
};

function ctx(userId: string | null, role: any): GraphQLContext {
  return { auth: { userId, role } };
}

function expectDomainError(err: unknown, code: string, field?: string) {
  expect(err).toBeInstanceOf(DomainError);
  const e = err as DomainError;
  expect(e.code).toBe(code);
  if (typeof field !== 'undefined') {
    expect(e.field).toBe(field);
  }
}

describe('ProductService', () => {
  let repo: Repo;

  beforeEach(() => {
    repo = {
      findBySlug: vi.fn(),
      findAllWithStore: vi.fn(),
      findByIdWithStore: vi.fn(),
      isStoreOwnedBy: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
    };

    vi.clearAllMocks();
  });

  describe('addProduct', () => {
    it('throws FORBIDDEN when not merchant', async () => {
      const service = new ProductService(repo as any);

      await expect(
        service.addProduct(ctx('u1', APP_ROLES.BUYER), {
          storeId: 's1',
          name: 'X',
          price: 10,
        } as any),
      ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });
    });

    it('throws FORBIDDEN when no userId', async () => {
      const service = new ProductService(repo as any);

      await expect(
        service.addProduct(ctx(null, APP_ROLES.MERCHANT), {
          storeId: 's1',
          name: 'X',
          price: 10,
        } as any),
      ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });
    });

    it('throws FORBIDDEN when merchant does not own store', async () => {
      (repo.isStoreOwnedBy as any).mockResolvedValue(false);
      const service = new ProductService(repo as any);

      await expect(
        service.addProduct(ctx('u1', APP_ROLES.MERCHANT), {
          storeId: 's1',
          name: 'X',
          price: 10,
        } as any),
      ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });

      expect(repo.isStoreOwnedBy).toHaveBeenCalledWith('s1', 'u1');
    });

    it('creates product with generated slug, normalized fields, and quantity defaults', async () => {
      (repo.isStoreOwnedBy as any).mockResolvedValue(true);
      (repo.findBySlug as any).mockResolvedValue(null);
      (repo.create as any).mockResolvedValue({ id: 'p1' });

      const service = new ProductService(repo as any);

      await service.addProduct(ctx('u1', APP_ROLES.MERCHANT), {
        storeId: 's1',
        name: '  Hello World!  ',
        price: 12.5,
        description: '   ',
        imageUrl: '',
      } as any);

      expect(repo.findBySlug).toHaveBeenCalledWith('hello-world');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'hello-world',
          name: '  Hello World!  ',
          price: 12.5,
          quantity: 0,
          inStock: false,
          description: null,
          imageUrl: null,
          store: { connect: { id: 's1' } },
        }),
      );
    });

    it('generates unique slug when collision exists', async () => {
      (repo.isStoreOwnedBy as any).mockResolvedValue(true);

      (repo.findBySlug as any)
        .mockResolvedValueOnce({ id: 'existing-1' }) // base taken
        .mockResolvedValueOnce({ id: 'existing-2' }) // base-2 taken
        .mockResolvedValueOnce(null); // base-3 free

      (repo.create as any).mockResolvedValue({ id: 'p1' });

      const service = new ProductService(repo as any);

      await service.addProduct(ctx('u1', APP_ROLES.MERCHANT), {
        storeId: 's1',
        name: 'Test',
        price: 10,
        quantity: 2,
      } as any);

      expect(repo.findBySlug).toHaveBeenCalledTimes(3);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'test-3',
          quantity: 2,
          inStock: true,
        }),
      );
    });

    it('throws validation error for invalid input (example: empty storeId)', async () => {
      const service = new ProductService(repo as any);

      await expect(
        service.addProduct(ctx('u1', APP_ROLES.MERCHANT), {
          storeId: '',
          name: 'X',
          price: 10,
        } as any),
      ).rejects.toBeTruthy();
    });
  });

  describe('updateProduct', () => {
    it('throws FORBIDDEN when not merchant', async () => {
      const service = new ProductService(repo as any);

      await expect(
        service.updateProduct(ctx('u1', APP_ROLES.BUYER), {
          id: 'p1',
          price: 10,
          description: null,
          imageUrl: null,
        } as any),
      ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });
    });

    it('throws PRODUCT_NOT_FOUND when product missing', async () => {
      (repo.findById as any).mockResolvedValue(null);
      const service = new ProductService(repo as any);

      await expect(
        service.updateProduct(ctx('u1', APP_ROLES.MERCHANT), {
          id: 'p1',
          price: 10,
          description: null,
          imageUrl: null,
        } as any),
      ).rejects.toMatchObject({ code: ERROR_CODES.PRODUCT_NOT_FOUND, field: 'id' });
    });

    it('throws NOT_FOUND when product has no storeId', async () => {
      (repo.findById as any).mockResolvedValue({ id: 'p1', storeId: null });
      const service = new ProductService(repo as any);

      await expect(
        service.updateProduct(ctx('u1', APP_ROLES.MERCHANT), {
          id: 'p1',
          price: 10,
          description: null,
          imageUrl: null,
        } as any),
      ).rejects.toMatchObject({ code: ERROR_CODES.NOT_FOUND });
    });

    it('throws FORBIDDEN when does not own store', async () => {
      (repo.findById as any).mockResolvedValue({ id: 'p1', storeId: 's1' });
      (repo.isStoreOwnedBy as any).mockResolvedValue(false);

      const service = new ProductService(repo as any);

      await expect(
        service.updateProduct(ctx('u1', APP_ROLES.MERCHANT), {
          id: 'p1',
          price: 10,
          description: null,
          imageUrl: null,
        } as any),
      ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });

      expect(repo.isStoreOwnedBy).toHaveBeenCalledWith('s1', 'u1');
    });

    it('updates price and normalizes fields; does not touch quantity if not provided', async () => {
      (repo.findById as any).mockResolvedValue({ id: 'p1', storeId: 's1' });
      (repo.isStoreOwnedBy as any).mockResolvedValue(true);
      (repo.update as any).mockResolvedValue({ id: 'p1' });

      const service = new ProductService(repo as any);

      await service.updateProduct(ctx('u1', APP_ROLES.MERCHANT), {
        id: 'p1',
        price: 99,
        description: '   hello  ',
        imageUrl: '',
      } as any);

      expect(repo.update).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          price: 99,
          description: 'hello',
          imageUrl: null,
        }),
      );

      const updateArg = (repo.update as any).mock.calls[0][1];
      expect(updateArg).not.toHaveProperty('quantity');
      expect(updateArg).not.toHaveProperty('inStock');
    });

    it('updates quantity and sets inStock when quantity provided', async () => {
      (repo.findById as any).mockResolvedValue({ id: 'p1', storeId: 's1' });
      (repo.isStoreOwnedBy as any).mockResolvedValue(true);
      (repo.update as any).mockResolvedValue({ id: 'p1' });

      const service = new ProductService(repo as any);

      await service.updateProduct(ctx('u1', APP_ROLES.MERCHANT), {
        id: 'p1',
        price: 20,
        description: null,
        imageUrl: null,
        quantity: 0,
      } as any);

      expect(repo.update).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          quantity: 0,
          inStock: false,
        }),
      );
    });
  });

  describe('deleteProduct', () => {
    it('throws FORBIDDEN when not merchant', async () => {
      const service = new ProductService(repo as any);

      await expect(service.deleteProduct(ctx('u1', APP_ROLES.BUYER), 'p1')).rejects.toMatchObject({
        code: ERROR_CODES.FORBIDDEN,
      });
    });

    it('throws INVALID_CHECKOUT_INPUT when id is empty', async () => {
      const service = new ProductService(repo as any);

      await expect(
        service.deleteProduct(ctx('u1', APP_ROLES.MERCHANT), '   '),
      ).rejects.toMatchObject({ code: ERROR_CODES.INVALID_CHECKOUT_INPUT, field: 'id' });
    });

    it('throws PRODUCT_NOT_FOUND when product does not exist', async () => {
      const service = new ProductService(repo as any);

      const tx = {
        product: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() },
        store: { findFirst: vi.fn() },
        checkoutLink: { updateMany: vi.fn() },
      };

      (prisma.$transaction as any).mockImplementation(async (fn: any) => fn(tx));

      await expect(
        service.deleteProduct(ctx('u1', APP_ROLES.MERCHANT), 'p1'),
      ).rejects.toMatchObject({ code: ERROR_CODES.PRODUCT_NOT_FOUND, field: 'id' });

      expect(tx.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1', deletedAt: null, isActive: true },
        }),
      );
    });

    it('throws NOT_FOUND when product has no storeId', async () => {
      const service = new ProductService(repo as any);

      const tx = {
        product: {
          findFirst: vi.fn().mockResolvedValue({ id: 'p1', storeId: null }),
          update: vi.fn(),
        },
        store: { findFirst: vi.fn() },
        checkoutLink: { updateMany: vi.fn() },
      };

      (prisma.$transaction as any).mockImplementation(async (fn: any) => fn(tx));

      await expect(
        service.deleteProduct(ctx('u1', APP_ROLES.MERCHANT), 'p1'),
      ).rejects.toMatchObject({ code: ERROR_CODES.NOT_FOUND });
    });

    it('throws FORBIDDEN when store is not owned by user', async () => {
      const service = new ProductService(repo as any);

      const tx = {
        product: {
          findFirst: vi.fn().mockResolvedValue({ id: 'p1', storeId: 's1' }),
          update: vi.fn(),
        },
        store: { findFirst: vi.fn().mockResolvedValue(null) },
        checkoutLink: { updateMany: vi.fn() },
      };

      (prisma.$transaction as any).mockImplementation(async (fn: any) => fn(tx));

      await expect(
        service.deleteProduct(ctx('u1', APP_ROLES.MERCHANT), 'p1'),
      ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });

      expect(tx.store.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's1', ownerId: 'u1' },
          select: { id: true },
        }),
      );
    });

    it('deactivates checkout links and soft deletes product on success', async () => {
      const service = new ProductService(repo as any);

      const tx = {
        product: {
          findFirst: vi.fn().mockResolvedValue({ id: 'p1', storeId: 's1' }),
          update: vi.fn().mockResolvedValue({ id: 'p1', isActive: false }),
        },
        store: { findFirst: vi.fn().mockResolvedValue({ id: 's1' }) },
        checkoutLink: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
      };

      (prisma.$transaction as any).mockImplementation(async (fn: any) => fn(tx));

      const res = await service.deleteProduct(ctx('u1', APP_ROLES.MERCHANT), 'p1');

      expect(tx.checkoutLink.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 'p1', active: true },
          data: { active: false },
        }),
      );

      expect(tx.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({
            isActive: false,
            deletedAt: expect.any(Date),
            inStock: false,
            quantity: 0,
          }),
        }),
      );

      expect(res).toEqual({ id: 'p1', isActive: false });
    });
  });
});
