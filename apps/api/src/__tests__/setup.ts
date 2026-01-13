import 'dotenv/config';
import { beforeAll, beforeEach, afterEach } from 'vitest';
import { resetTestDb } from './integration/reset-test-db';

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

function shouldResetDb() {
  const url = process.env.DATABASE_URL ?? '';
  return url.includes('test.db');
}

beforeAll(() => {
  assertTestDb();
});

beforeEach(async () => {
  if (shouldResetDb()) await resetTestDb();
});

afterEach(async () => {
  if (shouldResetDb()) await resetTestDb();
});
