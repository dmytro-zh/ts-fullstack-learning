import { describe, it, expect } from 'vitest';
import { prismaTest } from './db';

describe('integration db setup (smoke)', () => {
  it('uses sqlite test db', async () => {
    const rows = await prismaTest.$queryRaw<Array<{ file: string }>>`
      PRAGMA database_list;
    `;

    const main = rows.find((r) => r.file && r.file.length > 0);
    expect(main?.file).toContain('test.db');
  });

  it('resets between tests (afterEach)', async () => {
    await prismaTest.store.create({
      data: {
        name: 'Tmp',
        email: 'tmp@test.dev',
        ownerId: 'tmp-owner',
      },
    });

    const countNow = await prismaTest.store.count();
    expect(countNow).toBe(1);
  });

  it('is empty in the next test', async () => {
    const count = await prismaTest.store.count();
    expect(count).toBe(0);
  });
});
