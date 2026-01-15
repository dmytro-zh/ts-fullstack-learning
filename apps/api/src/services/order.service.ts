import { z } from 'zod';
import { $Enums } from '@prisma/client';
import { requireMerchantOrOwner } from '../auth/guards';
import { OrderRepository } from '../repositories/order.repository';
import type { GraphQLContext } from '../server-context';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { DomainError } from '../errors/domain-error';
import { ERROR_CODES } from '../errors/codes';

const storeIdSchema = z.string().min(1, 'storeId is required');
const orderIdSchema = z.string().min(1, 'orderId is required');

const orderStatusSchema = z.enum([
  'NEW',
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
]);

const ALLOWED_STATUS_TRANSITIONS = {
  NEW: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
} as const satisfies Partial<Record<$Enums.OrderStatus, readonly $Enums.OrderStatus[]>>;

function assertValidStatusTransition(from: $Enums.OrderStatus, to: $Enums.OrderStatus) {
  if (from === to) return;

  const transitions = ALLOWED_STATUS_TRANSITIONS as Partial<
    Record<$Enums.OrderStatus, readonly $Enums.OrderStatus[]>
  >;

  const allowed = transitions[from] ?? [];
  if (!allowed.includes(to)) {
    throw new DomainError(
      ERROR_CODES.INVALID_ORDER_STATUS_TRANSITION,
      'Invalid order status transition',
      { field: 'status', meta: { from, to } },
    );
  }
}

export class OrderService {
  constructor(private readonly repo = new OrderRepository()) {}

  async getByStore(ctx: GraphQLContext, storeId: string) {
    const id = storeIdSchema.parse(storeId);

    requireMerchantOrOwner(ctx);
    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    if (ctx.auth.role !== APP_ROLES.PLATFORM_OWNER) {
      const ownsStore = await this.repo.isStoreOwnedBy(id, userId);
      if (!ownsStore) {
        throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
      }
    }

    return this.repo.findByStore(id);
  }

  async getById(ctx: GraphQLContext, orderId: string) {
    const id = orderIdSchema.parse(orderId);

    requireMerchantOrOwner(ctx);
    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    const order = await this.repo.findById(id);
    if (!order) return null;

    if (!order.storeId) {
      throw new DomainError(ERROR_CODES.NOT_FOUND, 'Order store not found');
    }

    if (ctx.auth.role !== APP_ROLES.PLATFORM_OWNER) {
      const ownsStore = await this.repo.isStoreOwnedBy(order.storeId, userId);
      if (!ownsStore) {
        throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
      }
    }

    return order;
  }

  async updateStatus(ctx: GraphQLContext, orderId: string, status: string) {
    const id = orderIdSchema.parse(orderId);

    requireMerchantOrOwner(ctx);
    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    const order = await this.repo.findById(id);
    if (!order) {
      throw new DomainError(ERROR_CODES.NOT_FOUND, 'Order not found');
    }

    if (!order.storeId) {
      throw new DomainError(ERROR_CODES.NOT_FOUND, 'Order store not found');
    }

    if (ctx.auth.role !== APP_ROLES.PLATFORM_OWNER) {
      const ownsStore = await this.repo.isStoreOwnedBy(order.storeId, userId);
      if (!ownsStore) {
        throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
      }
    }

    const nextStatus = orderStatusSchema.parse(status) as $Enums.OrderStatus;

    assertValidStatusTransition(order.status as $Enums.OrderStatus, nextStatus);

    return this.repo.updateStatus(id, nextStatus);
  }
}
