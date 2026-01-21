import { cleanupTestData } from './helpers/cleanup';

export default async function globalSetup() {
  await cleanupTestData();
}
