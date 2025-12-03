import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export class ProductRepository {
  findAll() {
    return prisma.product.findMany();
  }

  findAllWithStore() {
    return prisma.product.findMany({ include: { store: true } });
  }

  findById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  }

  findByIdWithStore(id: string) {
    return prisma.product.findUnique({ where: { id }, include: { store: true } });
  }

  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  }

  update(id: string, data: Pick<Prisma.ProductUpdateInput, 'price' | 'inStock'>) {
    return prisma.product.update({
      where: { id },
      data,
    });
  }
}
