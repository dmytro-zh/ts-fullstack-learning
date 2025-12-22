import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export class ProductRepository {
  findAll() {
    return prisma.product.findMany();
  }

  findAllWithStore() {
    return prisma.product.findMany({
      include: { store: true, images: true },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  findByIdWithStore(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { store: true, images: true },
    });
  }

  findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
    });
  }

  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({
      data,
    });
  }

  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
    });
  }
}
