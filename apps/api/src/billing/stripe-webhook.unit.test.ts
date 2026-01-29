import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma', () => {
  return {
    prisma: {
      user: {
        update: vi.fn(),
      },
    },
  };
});

vi.mock('../lib/stripe', () => {
  return {
    getStripe: vi.fn(),
  };
});

vi.mock('../repositories/user.repository', () => {
  return {
    UserRepository: vi.fn(),
  };
});

import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getStripe } from '../lib/stripe';
import { UserRepository } from '../repositories/user.repository';
import { handleStripeWebhook } from './stripe-webhook';

const prismaUser = prisma.user as unknown as {
  update: ReturnType<typeof vi.fn>;
};

function buildReq(overrides?: Partial<Request>): Request {
  return {
    body: Buffer.from('stripe-event'),
    headers: {
      'stripe-signature': 'sig_test',
    },
    ...overrides,
  } as Request;
}

function buildRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  return res as unknown as Response;
}

describe('stripe webhook handler', () => {
  const stripeMock = {
    webhooks: {
      constructEvent: vi.fn(),
    },
  };
  const userRepoMock = {
    updateBillingByStripeCustomerId: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(stripeMock);
    (UserRepository as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return userRepoMock;
    });
  });

  it('returns 500 when webhook secret is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const res = buildRes();
    await handleStripeWebhook(buildReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'STRIPE_WEBHOOK_SECRET is not set' });
  });

  it('returns 400 when signature is missing', async () => {
    const res = buildRes();
    await handleStripeWebhook(buildReq({ headers: {} }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing Stripe signature' });
  });

  it('returns 400 when signature verification fails', async () => {
    stripeMock.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error('bad signature');
    });

    const res = buildRes();
    await handleStripeWebhook(buildReq(), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Webhook signature verification failed' });
  });

  it('updates user on checkout.session.completed', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          subscription: 'sub_123',
          metadata: { userId: 'u1' },
        },
      },
    });

    const res = buildRes();
    await handleStripeWebhook(buildReq(), res);

    expect(prismaUser.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
      },
    });
  });

  it('updates user when customer/subscription are objects', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: { id: 'cus_obj' },
          subscription: { id: 'sub_obj' },
          metadata: { userId: 'u2' },
        },
      },
    });

    const res = buildRes();
    await handleStripeWebhook(buildReq(), res);

    expect(prismaUser.update).toHaveBeenCalledWith({
      where: { id: 'u2' },
      data: {
        stripeCustomerId: 'cus_obj',
        stripeSubscriptionId: 'sub_obj',
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
      },
    });
  });

  it('updates billing on subscription changes', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_456',
          customer: 'cus_456',
          status: 'past_due',
        },
      },
    });

    const res = buildRes();
    await handleStripeWebhook(buildReq(), res);

    expect(userRepoMock.updateBillingByStripeCustomerId).toHaveBeenCalledWith('cus_456', {
      plan: 'PRO',
      subscriptionStatus: 'PAST_DUE',
      stripeSubscriptionId: 'sub_456',
    });
  });

  it('clears subscription on cancellation', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_789',
          customer: 'cus_789',
          status: 'canceled',
        },
      },
    });

    const res = buildRes();
    await handleStripeWebhook(buildReq(), res);

    expect(userRepoMock.updateBillingByStripeCustomerId).toHaveBeenCalledWith('cus_789', {
      plan: 'FREE',
      subscriptionStatus: 'CANCELED',
      stripeSubscriptionId: null,
    });
  });

  it('updates billing for active subscription with object customer', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_active',
          customer: { id: 'cus_active' },
          status: 'active',
        },
      },
    });

    const res = buildRes();
    await handleStripeWebhook(buildReq(), res);

    expect(userRepoMock.updateBillingByStripeCustomerId).toHaveBeenCalledWith('cus_active', {
      plan: 'PRO',
      subscriptionStatus: 'ACTIVE',
      stripeSubscriptionId: 'sub_active',
    });
  });

  it('skips subscription updates when customer is missing', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_missing',
          customer: null,
          status: 'active',
        },
      },
    });

    const res = buildRes();
    await handleStripeWebhook(buildReq(), res);

    expect(userRepoMock.updateBillingByStripeCustomerId).not.toHaveBeenCalled();
  });

  it('defaults billing status for unknown subscription status', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_unknown',
          customer: 'cus_unknown',
          status: 'incomplete',
        },
      },
    });

    const res = buildRes();
    await handleStripeWebhook(buildReq(), res);

    expect(userRepoMock.updateBillingByStripeCustomerId).toHaveBeenCalledWith('cus_unknown', {
      plan: 'FREE',
      subscriptionStatus: null,
      stripeSubscriptionId: 'sub_unknown',
    });
  });

  it('ignores unsupported event types', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'invoice.created',
      data: { object: {} },
    });

    const res = buildRes();
    await handleStripeWebhook(buildReq(), res);

    expect(prismaUser.update).not.toHaveBeenCalled();
    expect(userRepoMock.updateBillingByStripeCustomerId).not.toHaveBeenCalled();
  });

  it('logs and continues on handler errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaUser.update.mockRejectedValueOnce(new Error('db failed'));
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          subscription: 'sub_123',
          metadata: { userId: 'u1' },
        },
      },
    });

    const res = buildRes();
    await handleStripeWebhook(buildReq(), res);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
