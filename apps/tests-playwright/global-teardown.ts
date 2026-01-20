import { cleanupTestData } from './helpers/cleanup';

export default async function globalTeardown() {
  await cleanupTestData();
}
