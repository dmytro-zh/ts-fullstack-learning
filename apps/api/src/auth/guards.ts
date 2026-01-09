import { GraphQLError } from 'graphql';
import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared';

export function requireAuth(userId: string | null): string {
  if (!userId) {
    throw new GraphQLError('UNAUTHENTICATED', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return userId;
}

export function requireRole(role: AppRole | null, allowed: AppRole[]): AppRole {
  if (!role) {
    throw new GraphQLError('UNAUTHENTICATED', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if (!allowed.includes(role)) {
    throw new GraphQLError('FORBIDDEN', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return role;
}

export function isOwner(role: AppRole | null): boolean {
  return role === APP_ROLES.PLATFORM_OWNER;
}

export function isMerchant(role: AppRole | null): boolean {
  return role === APP_ROLES.MERCHANT;
}
