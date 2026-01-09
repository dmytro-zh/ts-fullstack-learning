import { describe, it, expect, vi } from 'vitest';
import { StoreService } from './store.service';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { DomainError } from '../errors/domain-error';
import { ERROR_CODES } from '../errors/codes';
import type { GraphQLContext } from '../server-context';

function ctx(auth: GraphQLContext['auth']): GraphQLContext {
  return { auth };
}

function makeRepo() {
  return {
    create: vi.fn(),
    findAll: vi.fn(),
    findAllByOwner: vi.fn(),
    findById: vi.fn(),
    findByIdForOwner: vi.fn(),
  };
}

describe('StoreService', () => {
  describe('createStore', () => {
    it('happy - MERCHANT can create store', async () => {
      const repo = makeRepo();
      repo.create.mockResolvedValue({ id: 's1' });

      const service = new StoreService(repo as any);

      const result = await service.createStore(
        ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }),
        { name: 'My Store', email: 'a@b.com' },
      );

      expect(repo.create).toHaveBeenCalledWith({
        name: 'My Store',
        email: 'a@b.com',
        ownerId: 'u1',
      });
      expect(result).toEqual({ id: 's1' });
    });

    it('happy - PLATFORM_OWNER can create store', async () => {
      const repo = makeRepo();
      repo.create.mockResolvedValue({ id: 's2' });

      const service = new StoreService(repo as any);

      await service.createStore(
        ctx({ userId: 'u2', role: APP_ROLES.PLATFORM_OWNER }),
        { name: 'Owner Store' },
      );

      expect(repo.create).toHaveBeenCalledWith({
        name: 'Owner Store',
        email: null,
        ownerId: 'u2',
      });
    });

    it('forbidden - missing auth (userId or role)', async () => {
      const repo = makeRepo();
      const service = new StoreService(repo as any);

      await expect(
        service.createStore(ctx({ userId: null, role: APP_ROLES.MERCHANT }), { name: 'X' }),
      ).rejects.toBeInstanceOf(DomainError);

      await expect(
        service.createStore(ctx({ userId: 'u1', role: null }), { name: 'X' }),
      ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });

      expect(repo.create).not.toHaveBeenCalled();
    });

    it('forbidden - BUYER cannot create store', async () => {
      const repo = makeRepo();
      const service = new StoreService(repo as any);

      await expect(
        service.createStore(ctx({ userId: 'u1', role: APP_ROLES.BUYER }), { name: 'X' }),
      ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });

      expect(repo.create).not.toHaveBeenCalled();
    });

    it('validation - empty name throws', async () => {
      const repo = makeRepo();
      const service = new StoreService(repo as any);

      await expect(
        service.createStore(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), { name: '' }),
      ).rejects.toBeTruthy();

      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('getStores', () => {
    it('happy - PLATFORM_OWNER gets all stores', async () => {
      const repo = makeRepo();
      repo.findAll.mockResolvedValue([{ id: 's1' }, { id: 's2' }]);

      const service = new StoreService(repo as any);

      const result = await service.getStores(ctx({ userId: 'u1', role: APP_ROLES.PLATFORM_OWNER }));

      expect(repo.findAll).toHaveBeenCalledTimes(1);
      expect(repo.findAllByOwner).not.toHaveBeenCalled();
      expect(result).toEqual([{ id: 's1' }, { id: 's2' }]);
    });

    it('happy - MERCHANT gets stores by owner', async () => {
      const repo = makeRepo();
      repo.findAllByOwner.mockResolvedValue([{ id: 's1' }]);

      const service = new StoreService(repo as any);

      const result = await service.getStores(ctx({ userId: 'u2', role: APP_ROLES.MERCHANT }));

      expect(repo.findAllByOwner).toHaveBeenCalledWith('u2');
      expect(repo.findAll).not.toHaveBeenCalled();
      expect(result).toEqual([{ id: 's1' }]);
    });

    it('forbidden - MERCHANT without userId', async () => {
      const repo = makeRepo();
      const service = new StoreService(repo as any);

      await expect(
        service.getStores(ctx({ userId: null, role: APP_ROLES.MERCHANT })),
      ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });

      expect(repo.findAllByOwner).not.toHaveBeenCalled();
      expect(repo.findAll).not.toHaveBeenCalled();
    });

    it('other roles - returns empty array', async () => {
      const repo = makeRepo();
      const service = new StoreService(repo as any);

      const result = await service.getStores(ctx({ userId: 'u1', role: APP_ROLES.BUYER }));

      expect(result).toEqual([]);
      expect(repo.findAll).not.toHaveBeenCalled();
      expect(repo.findAllByOwner).not.toHaveBeenCalled();
    });
  });

  describe('getStore', () => {
    it('happy - PLATFORM_OWNER can fetch by id', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue({ id: 's1' });

      const service = new StoreService(repo as any);

      const result = await service.getStore(
        ctx({ userId: 'u1', role: APP_ROLES.PLATFORM_OWNER }),
        's1',
      );

      expect(repo.findById).toHaveBeenCalledWith('s1');
      expect(result).toEqual({ id: 's1' });
    });

    it('happy - MERCHANT can fetch by id for owner', async () => {
      const repo = makeRepo();
      repo.findByIdForOwner.mockResolvedValue({ id: 's1' });

      const service = new StoreService(repo as any);

      const result = await service.getStore(
        ctx({ userId: 'u9', role: APP_ROLES.MERCHANT }),
        's1',
      );

      expect(repo.findByIdForOwner).toHaveBeenCalledWith('s1', 'u9');
      expect(result).toEqual({ id: 's1' });
    });

    it('forbidden - MERCHANT without userId', async () => {
      const repo = makeRepo();
      const service = new StoreService(repo as any);

      await expect(
        service.getStore(ctx({ userId: null, role: APP_ROLES.MERCHANT }), 's1'),
      ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });

      expect(repo.findByIdForOwner).not.toHaveBeenCalled();
    });

    it('other roles - returns null', async () => {
      const repo = makeRepo();
      const service = new StoreService(repo as any);

      const result = await service.getStore(ctx({ userId: 'u1', role: APP_ROLES.BUYER }), 's1');

      expect(result).toBeNull();
      expect(repo.findById).not.toHaveBeenCalled();
      expect(repo.findByIdForOwner).not.toHaveBeenCalled();
    });

    it('not found - returns null when repo returns null', async () => {
      const repo = makeRepo();
      repo.findByIdForOwner.mockResolvedValue(null);

      const service = new StoreService(repo as any);

      const result = await service.getStore(
        ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }),
        'missing',
      );

      expect(result).toBeNull();
    });
  });
});
