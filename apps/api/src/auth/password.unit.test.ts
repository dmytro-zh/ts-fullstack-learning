import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password utils', () => {
  it('hashes and verifies password', async () => {
    const hash = await hashPassword('secret-123');
    expect(hash).not.toBe('secret-123');
    await expect(verifyPassword('secret-123', hash)).resolves.toBe(true);
  });

  it('fails verification for wrong password', async () => {
    const hash = await hashPassword('secret-123');
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });
});
