import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export class ProductRepository {
  findAll() {
    return prisma.product.findMany();
  }

  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  }
}
