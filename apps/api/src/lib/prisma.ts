import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const isTest = process.env.NODE_ENV === 'test';

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: isTest ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production' && !isTest) {
  globalThis.prisma = prisma;
}
