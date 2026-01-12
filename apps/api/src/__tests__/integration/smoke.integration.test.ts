import { describe, it, expect } from 'vitest';
import { prismaTest } from './db';

describe('integration db setup (smoke)', () => {
    console.log('DATABASE_URL=', process.env.DATABASE_URL);
  it('uses sqlite test db and resets between tests', async () => {
    const rows = await prismaTest.$queryRaw<Array<{ file: string }>>`
      PRAGMA database_list;
    `;

    const main = rows.find((r: { file: string }) => r.file && r.file.length > 0);
    expect(main?.file).toContain('test.db');
  });

  it('is empty in the next test because reset runs afterEach', async () => {
    const count = await prismaTest.store.count();
    expect(count).toBe(0);
  });
});
