import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { APP_ROLES } from '@ts-fullstack-learning/shared';

const { getRequestAuthMock, getAccountForUserMock } = vi.hoisted(() => ({
  getRequestAuthMock: vi.fn(),
  getAccountForUserMock: vi.fn(),
}));

vi.mock('../auth/get-request-auth', () => ({
  getRequestAuth: getRequestAuthMock,
}));

vi.mock('../repositories/user.repository', () => ({
  UserRepository: class {
    getAccountForUser = getAccountForUserMock;
  },
}));

import { getAccountMe } from './account.controller';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('getAccountMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    getRequestAuthMock.mockResolvedValue({ userId: null, role: null });
    const res = makeRes();

    await getAccountMe({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('returns 404 when user is missing', async () => {
    getRequestAuthMock.mockResolvedValue({ userId: 'u1', role: APP_ROLES.MERCHANT });
    getAccountForUserMock.mockResolvedValue(null);
    const res = makeRes();

    await getAccountMe({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  it('returns 200 with account payload', async () => {
    getRequestAuthMock.mockResolvedValue({ userId: 'u1', role: APP_ROLES.MERCHANT });
    getAccountForUserMock.mockResolvedValue({
      email: 'merchant@example.com',
      role: APP_ROLES.MERCHANT,
      plan: 'FREE',
      subscriptionStatus: 'ACTIVE',
    });
    const res = makeRes();

    await getAccountMe({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      user: {
        email: 'merchant@example.com',
        role: APP_ROLES.MERCHANT,
        plan: 'FREE',
        subscriptionStatus: 'ACTIVE',
      },
    });
  });

  it('returns 500 on unexpected error', async () => {
    getRequestAuthMock.mockRejectedValue(new Error('boom'));
    const res = makeRes();

    await getAccountMe({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to load account info' });
  });
});
