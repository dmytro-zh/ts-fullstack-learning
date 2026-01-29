import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AuthError, AUTH_ERROR_CODES } from './auth.errors';

const { registerMerchantMock, prismaFindUniqueMock, prismaUpdateMock } = vi.hoisted(() => ({
  registerMerchantMock: vi.fn(),
  prismaFindUniqueMock: vi.fn(),
  prismaUpdateMock: vi.fn(),
}));

vi.mock('./auth.service', () => ({
  registerMerchant: registerMerchantMock,
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    merchantInvite: {
      findUnique: prismaFindUniqueMock,
      update: prismaUpdateMock,
    },
  },
}));

import { registerMerchantHandler } from './register-merchant.controller';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeReq(body: Record<string, unknown>): Request {
  return { body } as Request;
}

describe('registerMerchantHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when invite code is missing', async () => {
    const res = makeRes();

    await registerMerchantHandler(
      makeReq({ inviteCode: '', email: 'test@example.com', password: 'Password!123' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 when invite code is invalid', async () => {
    prismaFindUniqueMock.mockResolvedValue(null);
    const res = makeRes();

    await registerMerchantHandler(
      makeReq({ inviteCode: 'bad', email: 'test@example.com', password: 'Password!123' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(registerMerchantMock).not.toHaveBeenCalled();
  });

  it('returns 403 when invite code is already used', async () => {
    prismaFindUniqueMock.mockResolvedValue({
      id: 'invite-1',
      code: 'secret',
      email: null,
      usedAt: new Date(),
    });
    const res = makeRes();

    await registerMerchantHandler(
      makeReq({ inviteCode: 'secret', email: 'test@example.com', password: 'Password!123' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(registerMerchantMock).not.toHaveBeenCalled();
  });

  it('returns 403 when invite email does not match', async () => {
    prismaFindUniqueMock.mockResolvedValue({
      id: 'invite-1',
      code: 'secret',
      email: 'locked@example.com',
      usedAt: null,
    });
    const res = makeRes();

    await registerMerchantHandler(
      makeReq({ inviteCode: 'secret', email: 'test@example.com', password: 'Password!123' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(registerMerchantMock).not.toHaveBeenCalled();
  });

  it('returns 201 with token for valid invite code', async () => {
    prismaFindUniqueMock.mockResolvedValue({
      id: 'invite-1',
      code: 'secret',
      email: null,
      usedAt: null,
    });
    registerMerchantMock.mockResolvedValue({ token: 'token-123', userId: 'user-1' });
    const res = makeRes();

    await registerMerchantHandler(
      makeReq({ inviteCode: 'secret', email: 'test@example.com', password: 'Password!123' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ token: 'token-123' });
    expect(prismaUpdateMock).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: { usedAt: expect.any(Date), usedByUserId: 'user-1' },
    });
  });

  it('returns 400 for invalid input', async () => {
    prismaFindUniqueMock.mockResolvedValue({
      id: 'invite-1',
      code: 'secret',
      email: null,
      usedAt: null,
    });
    registerMerchantMock.mockImplementation(() => {
      throw new ZodError([]);
    });
    const res = makeRes();

    await registerMerchantHandler(
      makeReq({ inviteCode: 'secret', email: 'bad', password: 'short' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 when email is taken', async () => {
    prismaFindUniqueMock.mockResolvedValue({
      id: 'invite-1',
      code: 'secret',
      email: null,
      usedAt: null,
    });
    registerMerchantMock.mockImplementation(() => {
      throw new AuthError(AUTH_ERROR_CODES.EMAIL_TAKEN, 'Email already registered');
    });
    const res = makeRes();

    await registerMerchantHandler(
      makeReq({ inviteCode: 'secret', email: 'test@example.com', password: 'Password!123' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 500 for unexpected errors', async () => {
    prismaFindUniqueMock.mockResolvedValue({
      id: 'invite-1',
      code: 'secret',
      email: null,
      usedAt: null,
    });
    registerMerchantMock.mockImplementation(() => {
      throw new Error('boom');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();

    await registerMerchantHandler(
      makeReq({ inviteCode: 'secret', email: 'test@example.com', password: 'Password!123' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
