import { prisma } from '../lib/prisma';

export class OrderRepository {
  findByStore(storeId: string) {
    return prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, price: true } },
      },
    });
  }
}
