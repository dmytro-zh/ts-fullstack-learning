import { z } from 'zod';
import { StoreRepository } from '../repositories/store.repository';
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

    const { userId, role } = ctx.auth;
    if (!userId || !role) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    if (role !== APP_ROLES.MERCHANT && role !== APP_ROLES.PLATFORM_OWNER) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    return this.repo.create({
      name: parsed.name,
      email: parsed.email ?? null,
      ownerId: userId,
    });
  }

  async getStores(ctx: GraphQLContext) {
    const { userId, role } = ctx.auth;

    if (role === APP_ROLES.PLATFORM_OWNER) {
      return this.repo.findAll();
    }

    if (role === APP_ROLES.MERCHANT) {
      if (!userId) {
        throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
      }

      return this.repo.findAllByOwner(userId);
    }

    return [];
  }

  async getStore(ctx: GraphQLContext, id: string) {
    const { userId, role } = ctx.auth;

    if (role === APP_ROLES.PLATFORM_OWNER) {
      return this.repo.findById(id);
    }

    if (role === APP_ROLES.MERCHANT) {
      if (!userId) {
        throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
      }

      return this.repo.findByIdForOwner(id, userId);
    }

    return null;
  }
}
