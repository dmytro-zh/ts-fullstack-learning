import { prisma } from '../lib/prisma';

export class UserRepository {
  getBillingForUser(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { plan: true, subscriptionStatus: true },
    });
  }
}
