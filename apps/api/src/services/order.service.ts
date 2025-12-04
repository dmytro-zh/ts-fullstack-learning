import { z } from 'zod';
import { OrderRepository } from '../repositories/order.repository';

const storeIdSchema = z.string().min(1);

export class OrderService {
  constructor(private readonly repo = new OrderRepository()) {}

  getByStore(storeId: string) {
    const id = storeIdSchema.parse(storeId);
    return this.repo.findByStore(id);
  }
}
