import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import type { BillingPlan, SubscriptionStatus } from '@prisma/client';
import { getStripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { UserRepository } from '../repositories/user.repository';

type BillingUpdate = {
  plan: BillingPlan;
  subscriptionStatus: SubscriptionStatus | null;
  stripeSubscriptionId: string | null;
};

function mapSubscriptionStatus(status: Stripe.Subscription.Status): {
  plan: BillingPlan;
  subscriptionStatus: SubscriptionStatus | null;
  clearSubscription: boolean;
} {
  switch (status) {
    case 'active':
    case 'trialing':
      return { plan: 'PRO', subscriptionStatus: 'ACTIVE', clearSubscription: false };
    case 'past_due':
    case 'unpaid':
      return { plan: 'PRO', subscriptionStatus: 'PAST_DUE', clearSubscription: false };
    case 'canceled':
    case 'incomplete_expired':
      return { plan: 'FREE', subscriptionStatus: 'CANCELED', clearSubscription: true };
    default:
      return { plan: 'FREE', subscriptionStatus: null, clearSubscription: false };
  }
}

function getCustomerId(
  customer: Stripe.Checkout.Session['customer'] | Stripe.Subscription['customer'],
): string | null {
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  return customer.id ?? null;
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is not set' });
  }

  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  const userRepo = new UserRepository();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = getCustomerId(session.customer);
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;
        const userId = session.metadata?.userId;

        if (userId && customerId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId ?? null,
              plan: 'PRO',
              subscriptionStatus: 'ACTIVE',
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = getCustomerId(subscription.customer);
        if (!customerId) break;

        const mapped = mapSubscriptionStatus(subscription.status);

        await userRepo.updateBillingByStripeCustomerId(customerId, {
          plan: mapped.plan,
          subscriptionStatus: mapped.subscriptionStatus,
          stripeSubscriptionId: mapped.clearSubscription ? null : subscription.id,
        });

        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Stripe webhook handling failed', err);
  }

  return res.json({ received: true });
}
