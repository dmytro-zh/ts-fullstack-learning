import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignJWT } from 'jose';
import { issueReceiptToken, verifyReceiptToken } from './receipt-token';

const ORIGINAL_SECRET = process.env.API_JWT_SECRET;

function restoreSecret() {
  if (typeof ORIGINAL_SECRET === 'undefined') {
    delete process.env.API_JWT_SECRET;
  } else {
    process.env.API_JWT_SECRET = ORIGINAL_SECRET;
  }
}

describe('receipt-token', () => {
  beforeEach(() => {
    process.env.API_JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    vi.useRealTimers();
    restoreSecret();
  });

  it('issues and verifies a receipt token', async () => {
    const token = await issueReceiptToken({ orderId: 'o1', email: 'buyer@test.dev' });
    const payload = await verifyReceiptToken(token);

    expect(payload).toEqual({ orderId: 'o1', email: 'buyer@test.dev' });
  });

  it('throws when secret is missing', async () => {
    delete process.env.API_JWT_SECRET;
    await expect(issueReceiptToken({ orderId: 'o1', email: 'buyer@test.dev' })).rejects.toThrow(
      'API_JWT_SECRET is missing',
    );
  });

  it('returns null when secret is missing in verify', async () => {
    delete process.env.API_JWT_SECRET;
    const payload = await verifyReceiptToken('token');
    expect(payload).toBeNull();
  });

  it('returns null for token with wrong kind', async () => {
    const secret = new TextEncoder().encode(process.env.API_JWT_SECRET ?? '');
    const token = await new SignJWT({ email: 'buyer@test.dev', kind: 'other' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject('o1')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    const payload = await verifyReceiptToken(token);
    expect(payload).toBeNull();
  });

  it('returns null when email is missing', async () => {
    const secret = new TextEncoder().encode(process.env.API_JWT_SECRET ?? '');
    const token = await new SignJWT({ kind: 'receipt' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject('o1')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    const payload = await verifyReceiptToken(token);
    expect(payload).toBeNull();
  });

  it('returns null when orderId is missing', async () => {
    const secret = new TextEncoder().encode(process.env.API_JWT_SECRET ?? '');
    const token = await new SignJWT({ email: 'buyer@test.dev', kind: 'receipt' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    const payload = await verifyReceiptToken(token);
    expect(payload).toBeNull();
  });

  it('returns null for expired token', async () => {
    const now = new Date('2026-01-01T00:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const token = await issueReceiptToken({ orderId: 'o1', email: 'buyer@test.dev' });

    vi.setSystemTime(new Date(now.getTime() + 25 * 60 * 60 * 1000));
    const payload = await verifyReceiptToken(token);
    expect(payload).toBeNull();
  });

  it('returns null when secret does not match', async () => {
    process.env.API_JWT_SECRET = 'secret-a';
    const token = await issueReceiptToken({ orderId: 'o1', email: 'buyer@test.dev' });

    process.env.API_JWT_SECRET = 'secret-b';
    const payload = await verifyReceiptToken(token);
    expect(payload).toBeNull();
  });
});
