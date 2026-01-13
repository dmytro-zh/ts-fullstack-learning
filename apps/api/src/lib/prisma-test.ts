import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const defaultDbPath = path.resolve(process.cwd(), 'prisma/test.db');
const defaultDbUrl = `file:${defaultDbPath.split(path.sep).join('/')}`;

const databaseUrl = process.env.DATABASE_URL ?? defaultDbUrl;

export const prismaTest = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
  log: ['error', 'warn'],
});
