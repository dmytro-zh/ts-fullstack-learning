import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { DomainError } from '../errors/domain-error';
import { ERROR_CODES } from '../errors/codes';

// Hoisted mocks for repository instance
const mocks = vi.hoisted(() => {
  return {
    orderRepo: {
      findByStore: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      isStoreOwnedBy: vi.fn(),
    },
  };
});

vi.mock('../repositories/order.repository', () => {
  class OrderRepository {
    findByStore = mocks.orderRepo.findByStore;
    findById = mocks.orderRepo.findById;
    updateStatus = mocks.orderRepo.updateStatus;
    isStoreOwnedBy = mocks.orderRepo.isStoreOwnedBy;
  }
  return { OrderRepository };
});

// Import after mocks
import { OrderService } from './order.service';

const repoMock = mocks.orderRepo;

function ctx(auth: { userId: string | null; role: any | null }) {
  return { auth } as any;
}

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getByStore', () => {
    it('throws FORBIDDEN when missing userId', async () => {
      const service = new OrderService();
      await expect(
        service.getByStore(ctx({ userId: null, role: APP_ROLES.MERCHANT }), 's1'),
      ).rejects.toMatchObject({
        code: ERROR_CODES.FORBIDDEN,
      });
    });

    it('throws FORBIDDEN when role is not MERCHANT', async () => {
      const service = new OrderService();
      await expect(
        service.getByStore(ctx({ userId: 'u1', role: APP_ROLES.BUYER }), 's1'),
      ).rejects.toMatchObject({
        code: ERROR_CODES.FORBIDDEN,
      });
    });

    it('throws on invalid storeId', async () => {
      const service = new OrderService();
      await expect(
        service.getByStore(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), ''),
      ).rejects.toBeTruthy();
    });

    it('throws FORBIDDEN when user does not own store', async () => {
      repoMock.isStoreOwnedBy.mockResolvedValueOnce(false);

      const service = new OrderService();
      await expect(
        service.getByStore(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), 's1'),
      ).rejects.toMatchObject({
        code: ERROR_CODES.FORBIDDEN,
      });

      expect(repoMock.isStoreOwnedBy).toHaveBeenCalledWith('s1', 'u1');
    });

    it('returns orders when merchant owns store', async () => {
      repoMock.isStoreOwnedBy.mockResolvedValueOnce(true);
      repoMock.findByStore.mockResolvedValueOnce([{ id: 'o1' }]);

      const service = new OrderService();
      const res = await service.getByStore(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), 's1');

      expect(repoMock.isStoreOwnedBy).toHaveBeenCalledWith('s1', 'u1');
      expect(repoMock.findByStore).toHaveBeenCalledWith('s1');
      expect(res).toEqual([{ id: 'o1' }]);
    });
  });

  describe('getById', () => {
    it('throws FORBIDDEN when missing userId', async () => {
      const service = new OrderService();
      await expect(
        service.getById(ctx({ userId: null, role: APP_ROLES.MERCHANT }), 'o1'),
      ).rejects.toMatchObject({
        code: ERROR_CODES.FORBIDDEN,
      });
    });

    it('throws FORBIDDEN when role is not MERCHANT', async () => {
      const service = new OrderService();
      await expect(
        service.getById(ctx({ userId: 'u1', role: APP_ROLES.BUYER }), 'o1'),
      ).rejects.toMatchObject({
        code: ERROR_CODES.FORBIDDEN,
      });
    });

    it('returns null when order not found', async () => {
      repoMock.findById.mockResolvedValueOnce(null);

      const service = new OrderService();
      const res = await service.getById(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), 'o1');

      expect(repoMock.findById).toHaveBeenCalledWith('o1');
      expect(res).toBeNull();
    });

    it('throws NOT_FOUND when order has no storeId', async () => {
      repoMock.findById.mockResolvedValueOnce({ id: 'o1', storeId: null });

      const service = new OrderService();
      await expect(
        service.getById(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), 'o1'),
      ).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
      });
    });

    it('throws FORBIDDEN when user does not own store', async () => {
      repoMock.findById.mockResolvedValueOnce({ id: 'o1', storeId: 's1' });
      repoMock.isStoreOwnedBy.mockResolvedValueOnce(false);

      const service = new OrderService();
      await expect(
        service.getById(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), 'o1'),
      ).rejects.toMatchObject({
        code: ERROR_CODES.FORBIDDEN,
      });

      expect(repoMock.isStoreOwnedBy).toHaveBeenCalledWith('s1', 'u1');
    });

    it('returns order when merchant owns store', async () => {
      const order = { id: 'o1', storeId: 's1' };
      repoMock.findById.mockResolvedValueOnce(order);
      repoMock.isStoreOwnedBy.mockResolvedValueOnce(true);

      const service = new OrderService();
      const res = await service.getById(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), 'o1');

      expect(repoMock.findById).toHaveBeenCalledWith('o1');
      expect(repoMock.isStoreOwnedBy).toHaveBeenCalledWith('s1', 'u1');
      expect(res).toEqual(order);
    });
  });

  describe('updateStatus', () => {
    it('throws FORBIDDEN when missing userId', async () => {
      const service = new OrderService();
      await expect(
        service.updateStatus(ctx({ userId: null, role: APP_ROLES.MERCHANT }), 'o1', 'PAID'),
      ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });
    });

    it('throws FORBIDDEN when role is not MERCHANT', async () => {
      const service = new OrderService();
      await expect(
        service.updateStatus(ctx({ userId: 'u1', role: APP_ROLES.BUYER }), 'o1', 'PAID'),
      ).rejects.toMatchObject({
        code: ERROR_CODES.FORBIDDEN,
      });
    });

    it('throws NOT_FOUND when order not found', async () => {
      repoMock.findById.mockResolvedValueOnce(null);

      const service = new OrderService();
      await expect(
        service.updateStatus(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), 'o1', 'PAID'),
      ).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
      });
    });

    it('throws NOT_FOUND when order has no storeId', async () => {
      // status included so transition logic never sees undefined if the code changes order later
      repoMock.findById.mockResolvedValueOnce({ id: 'o1', storeId: null, status: 'PAID' });

      const service = new OrderService();
      await expect(
        service.updateStatus(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), 'o1', 'PAID'),
      ).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
      });
    });

    it('throws FORBIDDEN when user does not own store', async () => {
      repoMock.findById.mockResolvedValueOnce({ id: 'o1', storeId: 's1', status: 'PAID' });
      repoMock.isStoreOwnedBy.mockResolvedValueOnce(false);

      const service = new OrderService();
      await expect(
        service.updateStatus(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), 'o1', 'PAID'),
      ).rejects.toMatchObject({
        code: ERROR_CODES.FORBIDDEN,
      });
    });

    it('throws on invalid status', async () => {
      repoMock.findById.mockResolvedValueOnce({ id: 'o1', storeId: 's1', status: 'PAID' });
      repoMock.isStoreOwnedBy.mockResolvedValueOnce(true);

      const service = new OrderService();
      await expect(
        service.updateStatus(ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }), 'o1', 'NOPE'),
      ).rejects.toBeTruthy();
    });

    it('throws INVALID_ORDER_STATUS_TRANSITION when transition is forbidden (and includes meta)', async () => {
      repoMock.findById.mockResolvedValueOnce({ id: 'o1', storeId: 's1', status: 'PAID' });
      repoMock.isStoreOwnedBy.mockResolvedValueOnce(true);

      const service = new OrderService();

      let err: any;
      try {
        await service.updateStatus(
          ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }),
          'o1',
          'COMPLETED',
        );
      } catch (e) {
        err = e;
      }

      expect(err).toBeInstanceOf(DomainError);
      expect(err).toMatchObject({
        code: ERROR_CODES.INVALID_ORDER_STATUS_TRANSITION,
        field: 'status',
      });
      expect(err.meta).toEqual({ from: 'PAID', to: 'COMPLETED' });

      expect(repoMock.updateStatus).not.toHaveBeenCalled();
    });

    it('allows setting the same status (no transition) and calls updateStatus', async () => {
      repoMock.findById.mockResolvedValueOnce({ id: 'o1', storeId: 's1', status: 'PAID' });
      repoMock.isStoreOwnedBy.mockResolvedValueOnce(true);
      repoMock.updateStatus.mockResolvedValueOnce({ id: 'o1', status: 'PAID' });

      const service = new OrderService();
      const res = await service.updateStatus(
        ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }),
        'o1',
        'PAID',
      );

      expect(repoMock.updateStatus).toHaveBeenCalledWith('o1', 'PAID');
      expect(res).toEqual({ id: 'o1', status: 'PAID' });
    });

    it('updates status when transition is allowed (and owned)', async () => {
      repoMock.findById.mockResolvedValueOnce({ id: 'o1', storeId: 's1', status: 'PAID' });
      repoMock.isStoreOwnedBy.mockResolvedValueOnce(true);
      repoMock.updateStatus.mockResolvedValueOnce({ id: 'o1', status: 'PROCESSING' });

      const service = new OrderService();
      const res = await service.updateStatus(
        ctx({ userId: 'u1', role: APP_ROLES.MERCHANT }),
        'o1',
        'PROCESSING',
      );

      expect(repoMock.updateStatus).toHaveBeenCalledWith('o1', 'PROCESSING');
      expect(res).toEqual({ id: 'o1', status: 'PROCESSING' });
    });
  });
});
