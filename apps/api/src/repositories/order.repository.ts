import { prisma } from '../lib/prisma';
import { $Enums } from '@prisma/client';

export class OrderRepository {
  findByStore(storeId: string) {
    return prisma.order.findMany({
      where: {
        storeId,
        status: {
          in: [
            $Enums.OrderStatus.PAID,
            $Enums.OrderStatus.PROCESSING,
            $Enums.OrderStatus.SHIPPED,
            $Enums.OrderStatus.COMPLETED,
            $Enums.OrderStatus.CANCELLED,
            $Enums.OrderStatus.REFUNDED,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, price: true } },
      },
    });
  }

  updateStatus(orderId: string, status: $Enums.OrderStatus) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        product: { select: { id: true, name: true, price: true } },
      },
    });
  }
}
