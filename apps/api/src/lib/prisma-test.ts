import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for prisma-test');
}

// No global caching for tests.
// We want a clean, isolated client that uses DATABASE_URL from .env.test.
export const prismaTest = new PrismaClient({
  log: ['error', 'warn'],
});
