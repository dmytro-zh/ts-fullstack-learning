import { z } from 'zod';
import { StoreRepository } from '../repositories/store.repository';
import { requireMerchantOrOwner } from '../auth/guards';
import { APP_PLANS, APP_ROLES, FREE_PLAN_LIMITS } from '@ts-fullstack-learning/shared';
import type { GraphQLContext } from '../server-context';
import { DomainError } from '../errors/domain-error';
import { ERROR_CODES } from '../errors/codes';
import { UserRepository } from '../repositories/user.repository';

const storeInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
});
type StoreInput = z.infer<typeof storeInput>;

export class StoreService {
  constructor(
    private readonly repo = new StoreRepository(),
    private readonly userRepo = new UserRepository(),
  ) {}

  async createStore(ctx: GraphQLContext, input: StoreInput) {
    const parsed = storeInput.parse(input);

    requireMerchantOrOwner(ctx);
    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    if (ctx.auth.role !== APP_ROLES.PLATFORM_OWNER) {
      const billing = await this.userRepo.getBillingForUser(userId);
      if (!billing) {
        throw new DomainError(ERROR_CODES.NOT_FOUND, 'User not found');
      }
      if (
        billing.plan === APP_PLANS.PRO &&
        billing.subscriptionStatus &&
        billing.subscriptionStatus !== 'ACTIVE'
      ) {
        throw new DomainError(ERROR_CODES.SUBSCRIPTION_INACTIVE, 'Subscription is not active');
      }
      if (billing.plan === APP_PLANS.FREE) {
        const count = await this.repo.countByOwner(userId);
        if (count >= FREE_PLAN_LIMITS.stores) {
          throw new DomainError(ERROR_CODES.PLAN_LIMIT_EXCEEDED, 'Store limit reached');
        }
      }
    }

    return this.repo.create({
      name: parsed.name,
      email: parsed.email ?? null,
      ownerId: userId,
    });
  }

  async getStores(ctx: GraphQLContext) {
    requireMerchantOrOwner(ctx);
    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    const role = ctx.auth.role;

    if (role === APP_ROLES.PLATFORM_OWNER) {
      return this.repo.findAll();
    }

    return this.repo.findAllByOwner(userId);
  }

  async getStore(ctx: GraphQLContext, id: string) {
    requireMerchantOrOwner(ctx);
    const role = ctx.auth.role;
    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    if (role === APP_ROLES.PLATFORM_OWNER) {
      return this.repo.findById(id);
    }

    return this.repo.findByIdForOwner(id, userId);
  }
}
