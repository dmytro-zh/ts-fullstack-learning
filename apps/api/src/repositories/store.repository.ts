import { prisma } from '../lib/prisma';

type CreateStoreData = {
  name: string;
  email: string | null;
  ownerId: string;
};

export class StoreRepository {
  create(data: CreateStoreData) {
    return prisma.store.create({ data });
  }

  findAll() {
    return prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return prisma.store.findUnique({
      where: { id },
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

  countByOwner(ownerId: string) {
    return prisma.store.count({ where: { ownerId } });
  }
}
