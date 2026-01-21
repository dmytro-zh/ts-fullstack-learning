import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export class CheckoutLinkRepository {
  create(data: Prisma.CheckoutLinkCreateInput) {
    return prisma.checkoutLink.create({
      data,
      include: { product: true, store: true },
    });
  }

  findBySlug(slug: string) {
    return prisma.checkoutLink.findUnique({
      where: { slug },
      include: { product: true, store: true },
    });
  }

  update(id: string, data: Prisma.CheckoutLinkUpdateInput) {
    return prisma.checkoutLink.update({
      where: { id },
      data,
      include: { product: true, store: true },
    });
  }

  countByOwner(ownerId: string) {
    return prisma.checkoutLink.count({
      where: {
        active: true,
        store: { ownerId },
      },
    });
  }
}
