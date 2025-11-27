import { prisma } from '../lib/prisma';

export class OrderRepository {
  create(data: { customerName: string; email: string; total: number }) {
    return prisma.order.create({ data });
  }

  findById(id: string) {
    return prisma.order.findUnique({ where: { id }, include: { items: true } });
  }
}

export class OrderItemRepository {
  createMany(items: { orderId: string; productId: string; quantity: number; priceAtPurchase: number }[]) {
    return prisma.orderItem.createMany({ data: items });
  }
}
