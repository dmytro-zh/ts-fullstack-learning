import { prisma } from '../lib/prisma';
import type { BillingPlan, SubscriptionStatus } from '@prisma/client';

type BillingUpdate = {
  stripeSubscriptionId: string | null;
  plan: BillingPlan;
  subscriptionStatus: SubscriptionStatus | null;
};

export class UserRepository {
  getBillingForUser(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { plan: true, subscriptionStatus: true },
    });
  }

  findByStripeCustomerId(stripeCustomerId: string) {
    return prisma.user.findUnique({
      where: { stripeCustomerId },
      select: {
        id: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        plan: true,
        subscriptionStatus: true,
      },
    });
  }

  setStripeCustomerId(id: string, stripeCustomerId: string) {
    return prisma.user.update({
      where: { id },
      data: { stripeCustomerId },
      select: { id: true, stripeCustomerId: true },
    });
  }

  updateBillingByStripeCustomerId(stripeCustomerId: string, update: BillingUpdate) {
    return prisma.user.update({
      where: { stripeCustomerId },
      data: update,
      select: {
        id: true,
        plan: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });
  }
}
