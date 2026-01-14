import { beforeAll, beforeEach, afterEach } from 'vitest';
import { config as dotenv } from 'dotenv';
import path from 'node:path';

// Load apps/api/.env.test
dotenv({ path: path.resolve(process.cwd(), '.env.test'), override: true });

// Always force test DB for any vitest run
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/test.db';

function assertTestDb() {
  const url = process.env.DATABASE_URL ?? '';

  if (!url) throw new Error('DATABASE_URL is missing for tests');

  const lower = url.toLowerCase();

  if (lower.includes('dev.db')) {
    throw new Error(`Refusing to run tests on dev.db. DATABASE_URL=${url}`);
  }

  if (!lower.includes('test.db')) {
    throw new Error(`Tests must use test.db. DATABASE_URL=${url}`);
  }
}

beforeAll(() => {
  // Strict checks for ALL test suites
  assertTestDb();
});

const isIntegrationSuite = process.env.TEST_SUITE === 'integration';

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
