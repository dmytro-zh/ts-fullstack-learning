import { prisma } from '../lib/prisma';

export class CartRepository {
  findAll() {
    return prisma.cartItem.findMany({
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findByProductId(productId: string) {
    return prisma.cartItem.findFirst({ where: { productId }, include: { product: true } });
  }

  findById(id: string) {
    return prisma.cartItem.findUnique({ where: { id }, include: { product: true } });
  }

  create(productId: string, quantity: number) {
    return prisma.cartItem.create({ data: { productId, quantity }, include: { product: true } });
  }

  updateQuantity(id: string, quantity: number) {
    return prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: true },
    });
  }

  delete(id: string) {
    return prisma.cartItem.delete({ where: { id } });
  }
}
