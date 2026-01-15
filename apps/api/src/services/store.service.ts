import { z } from 'zod';
import { StoreRepository } from '../repositories/store.repository';
import { requireMerchantOrOwner } from '../auth/guards';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import type { GraphQLContext } from '../server-context';
import { DomainError } from '../errors/domain-error';
import { ERROR_CODES } from '../errors/codes';

const storeInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
});
type StoreInput = z.infer<typeof storeInput>;

export class StoreService {
  constructor(private readonly repo = new StoreRepository()) {}

  async createStore(ctx: GraphQLContext, input: StoreInput) {
    const parsed = storeInput.parse(input);

    requireMerchantOrOwner(ctx.auth.role);
    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    return this.repo.create({
      name: parsed.name,
      email: parsed.email ?? null,
      ownerId: userId,
    });
  }

  async getStores(ctx: GraphQLContext) {
    requireMerchantOrOwner(ctx.auth.role);
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
    requireMerchantOrOwner(ctx.auth.role);
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
