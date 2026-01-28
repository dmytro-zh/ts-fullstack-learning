import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { getStripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';

function getCheckoutWebhookSecret() {
  return process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;
}

async function markOrderFailed(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, quantity: true, productId: true },
  });

  if (!order || order.status === 'PAID' || order.status === 'FAILED') return;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: 'FAILED' },
    }),
    prisma.product.update({
      where: { id: order.productId },
      data: {
        quantity: { increment: order.quantity },
        inStock: true,
      },
    }),
  ]);
}

export async function handleCheckoutWebhook(req: Request, res: Response) {
  const secret = getCheckoutWebhookSecret();
  if (!secret) {
    return res.status(500).json({ error: 'STRIPE_CHECKOUT_WEBHOOK_SECRET is not set' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch {
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.id;
        const paymentIntentId =
          typeof session.payment_intent === 'string' ? session.payment_intent : null;
        const metadataOrderId = session.metadata?.orderId;

        if (metadataOrderId) {
          await prisma.order.update({
            where: { id: metadataOrderId },
            data: {
              status: 'PAID',
              checkoutSessionId: sessionId,
              paymentIntentId,
            },
          });
          break;
        }

        await prisma.order.update({
          where: { checkoutSessionId: sessionId },
          data: { status: 'PAID', paymentIntentId },
        });
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.id;
        const order = await prisma.order.findFirst({
          where: { checkoutSessionId: sessionId },
          select: { id: true },
        });
        if (order) {
          await markOrderFailed(order.id);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;
        const order = await prisma.order.findFirst({
          where: { paymentIntentId },
          select: { id: true },
        });
        if (order) {
          await markOrderFailed(order.id);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Checkout webhook handling failed', err);
  }

  return res.json({ received: true });
}
