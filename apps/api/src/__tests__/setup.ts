import { beforeAll, beforeEach, afterEach } from 'vitest';
import { config as dotenv } from 'dotenv';
import path from 'node:path';

// Load apps/api/.env.test no matter where tests are started from
dotenv({ path: path.resolve(process.cwd(), '.env.test') });

// Ensure DATABASE_URL exists for any test that imports Prisma stuff
process.env.DATABASE_URL ??= 'file:./prisma/test.db';

const isIntegrationSuite = process.env.TEST_SUITE === 'integration';

function assertTestDb() {
  const url = process.env.DATABASE_URL ?? '';

  if (!url) throw new Error('DATABASE_URL is missing for tests');

  if (url.includes('dev.db')) {
    throw new Error(`Refusing to run tests on dev.db. DATABASE_URL=${url}`);
  }

  if (!url.includes('test.db')) {
    throw new Error(`Tests must use test.db. DATABASE_URL=${url}`);
  }
}

beforeAll(() => {
  // Strict checks only for integration tests
  if (isIntegrationSuite) assertTestDb();
});

beforeEach(async () => {
  if (!isIntegrationSuite) return;
  const { resetTestDb } = await import('./integration/reset-test-db');
  await resetTestDb();
});

afterEach(async () => {
  if (!isIntegrationSuite) return;
  const { resetTestDb } = await import('./integration/reset-test-db');
  await resetTestDb();
});
