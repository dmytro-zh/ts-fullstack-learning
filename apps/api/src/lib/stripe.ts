import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripe) return stripe;

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is missing');
  }

  stripe = new Stripe(secret, {
    apiVersion: '2025-12-15.clover',
  });

  return stripe;
}
