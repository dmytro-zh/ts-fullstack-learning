import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock('../lib/stripe', () => {
  return {
    getStripe: vi.fn(),
  };
});

import { prisma } from '../lib/prisma';
import { getStripe } from '../lib/stripe';
import { createProCheckoutSession } from './billing.service';

const prismaUser = prisma.user as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
};

describe('billing.service', () => {
  const stripeMock = {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(stripeMock);
  });

  it('creates a subscription checkout session', async () => {
    prismaUser.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'm@x.com' });
    stripeMock.checkout.sessions.create.mockResolvedValueOnce({
      id: 'cs_123',
      url: 'https://stripe.test/checkout',
    });

    const result = await createProCheckoutSession({
      userId: 'u1',
      priceId: 'price_123',
      successUrl: 'http://localhost:3000/billing?status=success&session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'http://localhost:3000/billing?status=cancelled',
    });

    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith({
      mode: 'subscription',
      line_items: [{ price: 'price_123', quantity: 1 }],
      customer_email: 'm@x.com',
      success_url: 'http://localhost:3000/billing?status=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/billing?status=cancelled',
      metadata: { userId: 'u1', plan: 'PRO' },
    });

    expect(result).toEqual({ id: 'cs_123', url: 'https://stripe.test/checkout' });
  });

  it('throws when user is not found', async () => {
    prismaUser.findUnique.mockResolvedValueOnce(null);

    await expect(
      createProCheckoutSession({
        userId: 'missing',
        priceId: 'price_123',
        successUrl: 'http://localhost:3000/billing?status=success&session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: 'http://localhost:3000/billing?status=cancelled',
      }),
    ).rejects.toThrow('User not found');
  });
});
