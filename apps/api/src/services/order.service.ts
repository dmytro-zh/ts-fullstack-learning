import { z } from 'zod';
import { $Enums } from '@prisma/client';
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

export class OrderService {
  constructor(private readonly repo = new OrderRepository()) {}

  async getByStore(ctx: GraphQLContext, storeId: string) {
    const id = storeIdSchema.parse(storeId);

    if (!ctx.auth.userId || ctx.auth.role !== APP_ROLES.MERCHANT) {
      throw new DomainError(
        ERROR_CODES.FORBIDDEN,
        'Access denied',
      );
    }

    const ownsStore = await this.repo.isStoreOwnedBy(id, ctx.auth.userId);
    if (!ownsStore) {
      throw new DomainError(
        ERROR_CODES.FORBIDDEN,
        'Access denied',
      );
    }

    return this.repo.findByStore(id);
  }

  async getById(ctx: GraphQLContext, orderId: string) {
    const id = orderIdSchema.parse(orderId);

    if (!ctx.auth.userId || ctx.auth.role !== APP_ROLES.MERCHANT) {
      throw new DomainError(
        ERROR_CODES.FORBIDDEN,
        'Access denied',
      );
    }

    const order = await this.repo.findById(id);
    if (!order) return null;

    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(
        ERROR_CODES.FORBIDDEN,
        'Access denied',
      );
    }

    if (!order.storeId) {
      throw new DomainError(
        ERROR_CODES.NOT_FOUND,
        'Order store not found',
      );
    }

    const ownsStore = await this.repo.isStoreOwnedBy(order.storeId, userId);
    if (!ownsStore) {
      throw new DomainError(
        ERROR_CODES.FORBIDDEN,
        'Access denied',
      );
    }

    return order;
  }

  async updateStatus(ctx: GraphQLContext, orderId: string, status: string) {
    const id = orderIdSchema.parse(orderId);

    if (!ctx.auth.userId || ctx.auth.role !== APP_ROLES.MERCHANT) {
      throw new DomainError(
        ERROR_CODES.FORBIDDEN,
        'Access denied',
      );
    }

    const order = await this.repo.findById(id);
    if (!order) {
      throw new DomainError(
        ERROR_CODES.NOT_FOUND,
        'Order not found',
      );
    }

    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(
        ERROR_CODES.FORBIDDEN,
        'Access denied',
      );
    }

    if (!order.storeId) {
      throw new DomainError(
        ERROR_CODES.NOT_FOUND,
        'Order store not found',
      );
    }

    const ownsStore = await this.repo.isStoreOwnedBy(order.storeId, userId);
    if (!ownsStore) {
      throw new DomainError(
        ERROR_CODES.FORBIDDEN,
        'Access denied',
      );
    }

    const nextStatus = orderStatusSchema.parse(status) as $Enums.OrderStatus;
    return this.repo.updateStatus(id, nextStatus);
  }
}
