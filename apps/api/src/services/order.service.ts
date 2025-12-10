import { z } from 'zod';
import { $Enums } from '@prisma/client';
import { OrderRepository } from '../repositories/order.repository';

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

  getByStore(storeId: string) {
    const id = storeIdSchema.parse(storeId);
    return this.repo.findByStore(id);
  }

  getById(orderId: string) {
    const id = orderIdSchema.parse(orderId);
    return this.repo.findById(id);
  }

  updateStatus(orderId: string, status: string) {
    const id = orderIdSchema.parse(orderId);
    const nextStatus = orderStatusSchema.parse(status) as $Enums.OrderStatus;
    return this.repo.updateStatus(id, nextStatus);
  }
}
