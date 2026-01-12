import { beforeAll, afterEach, afterAll } from 'vitest';
import { resetDb, disconnectDb } from './db';

beforeAll(async () => {
  await resetDb();
});

afterEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});
