import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { APP_ROLES } from '@ts-fullstack-learning/shared';

const { getRequestAuthMock, getBillingForUserMock } = vi.hoisted(() => ({
  getRequestAuthMock: vi.fn(),
  getBillingForUserMock: vi.fn(),
}));

vi.mock('../auth/get-request-auth', () => ({
  getRequestAuth: getRequestAuthMock,
}));

vi.mock('../repositories/user.repository', () => ({
  UserRepository: class {
    getBillingForUser = getBillingForUserMock;
  },
}));

import { getBillingMe } from './billing.controller';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('getBillingMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    getRequestAuthMock.mockResolvedValue({ userId: null, role: null });
    const res = makeRes();

    await getBillingMe({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('returns 403 when role is not allowed', async () => {
    getRequestAuthMock.mockResolvedValue({ userId: 'u1', role: APP_ROLES.BUYER });
    const res = makeRes();

    await getBillingMe({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('returns 404 when user missing', async () => {
    getRequestAuthMock.mockResolvedValue({ userId: 'u1', role: APP_ROLES.MERCHANT });
    getBillingForUserMock.mockResolvedValue(null);
    const res = makeRes();

    await getBillingMe({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  it('returns billing payload', async () => {
    getRequestAuthMock.mockResolvedValue({ userId: 'u1', role: APP_ROLES.MERCHANT });
    getBillingForUserMock.mockResolvedValue({
      plan: 'PRO',
      subscriptionStatus: 'ACTIVE',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_456',
    });
    const res = makeRes();

    await getBillingMe({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      plan: 'PRO',
      subscriptionStatus: 'ACTIVE',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_456',
    });
  });
});
