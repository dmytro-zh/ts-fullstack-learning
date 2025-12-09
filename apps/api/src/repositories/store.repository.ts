import { prisma } from '../lib/prisma';

type CreateStoreData = {
  name: string;
  email: string | null;
  ownerId: string;
};

export class StoreRepository {
  create(data: CreateStoreData) {
    return prisma.store.create({
      data,
    });
  }

  findAllByOwner(ownerId: string) {
    return prisma.store.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByIdForOwner(id: string, ownerId: string) {
    return prisma.store.findFirst({
      where: { id, ownerId },
    });
  }
}