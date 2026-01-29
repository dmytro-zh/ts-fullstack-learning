import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma', () => {
  return {
    prisma: {
      order: {
        update: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      product: {
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

vi.mock('../lib/stripe', () => {
  return {
    getStripe: vi.fn(),
  };
});

import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getStripe } from '../lib/stripe';
import { handleCheckoutWebhook } from './checkout-webhook';

const prismaOrder = prisma.order as unknown as {
  update: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
};
const prismaProduct = prisma.product as unknown as {
  update: ReturnType<typeof vi.fn>;
};
const prismaTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

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

describe('checkout webhook handler', () => {
  const stripeMock = {
    webhooks: {
      constructEvent: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET = 'whsec_test';
    delete process.env.STRIPE_WEBHOOK_SECRET;
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(stripeMock);
  });

  it('returns 500 when webhook secret is missing', async () => {
    delete process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const res = buildRes();
    await handleCheckoutWebhook(buildReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'STRIPE_CHECKOUT_WEBHOOK_SECRET is not set',
    });
  });

  it('returns 400 when signature is missing', async () => {
    const res = buildRes();
    await handleCheckoutWebhook(buildReq({ headers: {} }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing Stripe signature' });
  });

  it('returns 400 when signature verification fails', async () => {
    stripeMock.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error('bad signature');
    });

    const res = buildRes();
    await handleCheckoutWebhook(buildReq(), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Webhook signature verification failed' });
  });

  it('marks order paid by metadata orderId on checkout.session.completed', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          payment_intent: 'pi_123',
          metadata: { orderId: 'order_1' },
        },
      },
    });

    prismaOrder.findUnique.mockResolvedValueOnce({
      id: 'order_1',
      status: 'PENDING_PAYMENT',
    });

    const res = buildRes();
    await handleCheckoutWebhook(buildReq(), res);

    expect(prismaOrder.update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: {
        status: 'PAID',
        checkoutSessionId: 'cs_123',
        paymentIntentId: 'pi_123',
      },
    });
  });

  it('marks order paid by session id when metadata is missing', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_456',
          payment_intent: 'pi_456',
        },
      },
    });

    prismaOrder.findFirst.mockResolvedValueOnce({
      id: 'order_2',
      status: 'PENDING_PAYMENT',
    });

    const res = buildRes();
    await handleCheckoutWebhook(buildReq(), res);

    expect(prismaOrder.update).toHaveBeenCalledWith({
      where: { id: 'order_2' },
      data: {
        status: 'PAID',
        paymentIntentId: 'pi_456',
      },
    });
  });

  it('marks order failed and restores inventory on checkout.session.expired', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_expired',
        },
      },
    });

    prismaOrder.findFirst.mockResolvedValueOnce({ id: 'order_expired' });
    prismaOrder.findUnique.mockResolvedValueOnce({
      id: 'order_expired',
      status: 'PENDING_PAYMENT',
      quantity: 2,
      productId: 'prod_1',
    });
    prismaOrder.update.mockReturnValueOnce('orderUpdate');
    prismaProduct.update.mockReturnValueOnce('productUpdate');

    const res = buildRes();
    await handleCheckoutWebhook(buildReq(), res);

    expect(prismaTransaction).toHaveBeenCalledWith(['orderUpdate', 'productUpdate']);
    expect(prismaOrder.update).toHaveBeenCalledWith({
      where: { id: 'order_expired' },
      data: { status: 'FAILED' },
    });
    expect(prismaProduct.update).toHaveBeenCalledWith({
      where: { id: 'prod_1' },
      data: { quantity: { increment: 2 }, inStock: true },
    });
  });

  it('marks order failed and restores inventory on payment_intent.payment_failed', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_fail',
        },
      },
    });

    prismaOrder.findFirst.mockResolvedValueOnce({ id: 'order_fail' });
    prismaOrder.findUnique.mockResolvedValueOnce({
      id: 'order_fail',
      status: 'PENDING_PAYMENT',
      quantity: 1,
      productId: 'prod_fail',
    });
    prismaOrder.update.mockReturnValueOnce('orderUpdate');
    prismaProduct.update.mockReturnValueOnce('productUpdate');

    const res = buildRes();
    await handleCheckoutWebhook(buildReq(), res);

    expect(prismaTransaction).toHaveBeenCalledWith(['orderUpdate', 'productUpdate']);
  });

  it('ignores unsupported event types', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'invoice.created',
      data: { object: {} },
    });

    const res = buildRes();
    await handleCheckoutWebhook(buildReq(), res);

    expect(prismaOrder.update).not.toHaveBeenCalled();
    expect(prismaProduct.update).not.toHaveBeenCalled();
  });

  it('skips inventory restore if order is already paid', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_paid',
        },
      },
    });

    prismaOrder.findFirst.mockResolvedValueOnce({ id: 'order_paid' });
    prismaOrder.findUnique.mockResolvedValueOnce({
      id: 'order_paid',
      status: 'PAID',
      quantity: 1,
      productId: 'prod_paid',
    });

    const res = buildRes();
    await handleCheckoutWebhook(buildReq(), res);

    expect(prismaTransaction).not.toHaveBeenCalled();
    expect(prismaOrder.update).not.toHaveBeenCalled();
  });

  it('logs and continues on handler errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaOrder.findUnique.mockResolvedValueOnce({
      id: 'order_error',
      status: 'PENDING_PAYMENT',
    });
    prismaOrder.update.mockRejectedValueOnce(new Error('db failed'));

    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_error',
          payment_intent: 'pi_error',
          metadata: { orderId: 'order_error' },
        },
      },
    });

    const res = buildRes();
    await handleCheckoutWebhook(buildReq(), res);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
