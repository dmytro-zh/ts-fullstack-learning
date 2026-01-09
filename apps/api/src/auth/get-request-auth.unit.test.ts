import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type express from 'express';
import { SignJWT } from 'jose';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { getRequestAuth } from './get-request-auth';

function reqWithAuthHeader(value?: string): express.Request {
  return {
    headers: value ? { authorization: value } : {},
  } as any;
}

function normalizeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

async function makeToken(input: {
  sub: string;
  email: string;
  role: string;
  secret: string;
  exp?: string;
}): Promise<string> {
  const jwt = new SignJWT({ email: input.email, role: input.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(input.sub)
    .setIssuedAt();

  if (input.exp) jwt.setExpirationTime(input.exp);
  else jwt.setExpirationTime('7d');

  return jwt.sign(normalizeSecret(input.secret));
}

describe('getRequestAuth', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('returns null auth when no authorization header', async () => {
    vi.stubEnv('API_JWT_SECRET', 'test-secret');
    const auth = await getRequestAuth(reqWithAuthHeader());
    expect(auth).toEqual({ userId: null, role: null });
  });

  it('returns null auth when scheme is not Bearer', async () => {
    vi.stubEnv('API_JWT_SECRET', 'test-secret');
    const auth = await getRequestAuth(reqWithAuthHeader('Basic abc'));
    expect(auth).toEqual({ userId: null, role: null });
  });

  it('returns null auth when Bearer token is missing/empty', async () => {
    vi.stubEnv('API_JWT_SECRET', 'test-secret');

    const a = await getRequestAuth(reqWithAuthHeader('Bearer'));
    const b = await getRequestAuth(reqWithAuthHeader('Bearer   '));

    expect(a).toEqual({ userId: null, role: null });
    expect(b).toEqual({ userId: null, role: null });
  });

  it('returns null auth when API_JWT_SECRET is missing', async () => {
    vi.unstubAllEnvs(); // ensure missing
    const token = await makeToken({
      sub: 'u1',
      email: 'u1@example.com',
      role: APP_ROLES.MERCHANT,
      secret: 'whatever',
    });

    const auth = await getRequestAuth(reqWithAuthHeader(`Bearer ${token}`));
    expect(auth).toEqual({ userId: null, role: null });
  });

  it('returns userId and role for a valid token', async () => {
    vi.stubEnv('API_JWT_SECRET', 'test-secret');

    const token = await makeToken({
      sub: 'user-123',
      email: 'user@example.com',
      role: APP_ROLES.MERCHANT,
      secret: 'test-secret',
    });

    const auth = await getRequestAuth(reqWithAuthHeader(`Bearer ${token}`));
    expect(auth).toEqual({ userId: 'user-123', role: APP_ROLES.MERCHANT });
  });

  it('returns role null when role is not an AppRole', async () => {
    vi.stubEnv('API_JWT_SECRET', 'test-secret');

    const token = await makeToken({
      sub: 'user-123',
      email: 'user@example.com',
      role: 'HACKER_ROLE',
      secret: 'test-secret',
    });

    const auth = await getRequestAuth(reqWithAuthHeader(`Bearer ${token}`));
    expect(auth).toEqual({ userId: 'user-123', role: null });
  });

  it('returns userId null when sub is empty', async () => {
    vi.stubEnv('API_JWT_SECRET', 'test-secret');

    const token = await makeToken({
      sub: '',
      email: 'user@example.com',
      role: APP_ROLES.BUYER,
      secret: 'test-secret',
    });

    const auth = await getRequestAuth(reqWithAuthHeader(`Bearer ${token}`));
    expect(auth).toEqual({ userId: null, role: APP_ROLES.BUYER });
  });

  it('returns null auth when token is expired', async () => {
    vi.useFakeTimers();
    vi.stubEnv('API_JWT_SECRET', 'test-secret');

    const token = await makeToken({
      sub: 'user-123',
      email: 'user@example.com',
      role: APP_ROLES.MERCHANT,
      secret: 'test-secret',
      exp: '1s',
    });

    // move time forward so exp is in the past
    vi.setSystemTime(Date.now() + 2000);

    const auth = await getRequestAuth(reqWithAuthHeader(`Bearer ${token}`));
    expect(auth).toEqual({ userId: null, role: null });
  });
});
