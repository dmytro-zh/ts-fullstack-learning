import { describe, expect, it, beforeEach } from 'vitest';
import { jwtVerify } from 'jose';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { issueApiToken } from './issue-api-token';

function normalizeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

describe('issueApiToken', () => {
  beforeEach(() => {
    process.env.API_JWT_SECRET = 'test-secret';
  });

  it('throws when API_JWT_SECRET is missing', async () => {
    delete process.env.API_JWT_SECRET;

    await expect(
      issueApiToken({
        userId: 'u1',
        email: 'u1@example.com',
        role: APP_ROLES.MERCHANT,
      }),
    ).rejects.toThrow('API_JWT_SECRET is missing');
  });

  it('throws when role is invalid', async () => {
    await expect(
      issueApiToken({
        userId: 'u1',
        email: 'u1@example.com',
        role: 'NOT_A_ROLE' as any,
      }),
    ).rejects.toThrow('Invalid role for token');
  });

  it('issues a valid JWT with expected payload', async () => {
    const token = await issueApiToken({
      userId: 'user-123',
      email: 'user@example.com',
      role: APP_ROLES.PLATFORM_OWNER,
    });

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const { payload } = await jwtVerify(token, normalizeSecret('test-secret'));
    expect(payload.sub).toBe('user-123');
    expect(payload.email).toBe('user@example.com');
    expect(payload.role).toBe(APP_ROLES.PLATFORM_OWNER);
  });
});
