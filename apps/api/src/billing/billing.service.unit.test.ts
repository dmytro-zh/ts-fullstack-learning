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

vi.mock('../repositories/user.repository', () => {
  return {
    UserRepository: vi.fn(),
  };
});

import { prisma } from '../lib/prisma';
import { getStripe } from '../lib/stripe';
import { UserRepository } from '../repositories/user.repository';
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
    customers: {
      create: vi.fn(),
    },
  };
  const userRepoMock = {
    setStripeCustomerId: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(stripeMock);
    (UserRepository as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return userRepoMock;
    });
  });

  it('creates a subscription checkout session with a new customer', async () => {
    prismaUser.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'm@x.com',
      stripeCustomerId: null,
    });
    stripeMock.customers.create.mockResolvedValueOnce({ id: 'cus_123' });
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

    expect(stripeMock.customers.create).toHaveBeenCalledWith({
      email: 'm@x.com',
      metadata: { userId: 'u1' },
    });

    expect(userRepoMock.setStripeCustomerId).toHaveBeenCalledWith('u1', 'cus_123');

    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith({
      mode: 'subscription',
      line_items: [{ price: 'price_123', quantity: 1 }],
      customer: 'cus_123',
      success_url: 'http://localhost:3000/billing?status=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/billing?status=cancelled',
      metadata: { userId: 'u1', plan: 'PRO' },
    });

    expect(result).toEqual({ id: 'cs_123', url: 'https://stripe.test/checkout' });
  });

  it('reuses existing Stripe customer', async () => {
    prismaUser.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'm@x.com',
      stripeCustomerId: 'cus_existing',
    });
    stripeMock.checkout.sessions.create.mockResolvedValueOnce({
      id: 'cs_456',
      url: 'https://stripe.test/checkout',
    });

    await createProCheckoutSession({
      userId: 'u1',
      priceId: 'price_123',
      successUrl: 'http://localhost:3000/billing?status=success&session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'http://localhost:3000/billing?status=cancelled',
    });

    expect(stripeMock.customers.create).not.toHaveBeenCalled();
    expect(userRepoMock.setStripeCustomerId).not.toHaveBeenCalled();
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' }),
    );
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
