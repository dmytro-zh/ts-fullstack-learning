import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { getStripe } from '../lib/stripe';
import { UserRepository } from '../repositories/user.repository';

const createCheckoutSessionInput = z.object({
  userId: z.string().min(1),
  priceId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionInput>;

export async function createProCheckoutSession(input: CreateCheckoutSessionInput) {
  const data = createCheckoutSessionInput.parse(input);

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true, email: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const stripe = getStripe();
  const userRepo = new UserRepository();

  let stripeCustomerId = user.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });

    stripeCustomerId = customer.id;
    await userRepo.setStripeCustomerId(user.id, stripeCustomerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: data.priceId, quantity: 1 }],
    customer: stripeCustomerId,
    success_url: data.successUrl,
    cancel_url: data.cancelUrl,
    metadata: { userId: user.id, plan: 'PRO' },
  });

  if (!session.url) {
    throw new Error('Stripe session is missing url');
  }

  return { id: session.id, url: session.url };
}
