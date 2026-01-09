import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const ACTIVE_PRODUCT_WHERE: Prisma.ProductWhereInput = {
  deletedAt: null,
  isActive: true,
};

export class ProductRepository {
  findAll() {
    return prisma.product.findMany({
      where: ACTIVE_PRODUCT_WHERE,
    });
  }

  findAllWithStore() {
    return prisma.product.findMany({
      where: ACTIVE_PRODUCT_WHERE,
      include: { store: true, images: true },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findById(id: string) {
    return prisma.product.findFirst({
      where: { id, ...ACTIVE_PRODUCT_WHERE },
    });
  }

  findByIdWithStore(id: string) {
    return prisma.product.findFirst({
      where: { id, ...ACTIVE_PRODUCT_WHERE },
      include: { store: true, images: true },
    });
  }

  findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, ...ACTIVE_PRODUCT_WHERE },
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

  async isStoreOwnedBy(storeId: string, ownerId: string) {
    const store = await prisma.store.findFirst({
      where: { id: storeId, ownerId },
      select: { id: true },
    });

    return Boolean(store);
  }
}
