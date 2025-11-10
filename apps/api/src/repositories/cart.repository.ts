import { prisma } from '../lib/prisma';

export class CartRepository {
  findAll() {
    return prisma.cartItem.findMany({
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findByProductId(productId: string) {
    return prisma.cartItem.findFirst({ where: { productId } });
  }

  create(productId: string, quantity: number) {
    return prisma.cartItem.create({ data: { productId, quantity } });
  }

  updateQuantity(id: string, quantity: number) {
    return prisma.cartItem.update({ where: { id }, data: { quantity } });
  }

  delete(id: string) {
    return prisma.cartItem.delete({ where: { id } });
  }
}
