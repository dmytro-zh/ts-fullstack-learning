import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export class StoreRepository {
  create(data: Prisma.StoreCreateInput) {
    return prisma.store.create({ data });
  }

  findAll() {
    return prisma.store.findMany({ include: { products: true } });
  }

  findById(id: string) {
    return prisma.store.findUnique({ where: { id }, include: { products: true } });
  }
}
