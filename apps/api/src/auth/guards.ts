import { GraphQLError } from 'graphql';
import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared';

type AuthLike = { auth: { role: AppRole | null } };

function getRole(input: AppRole | null | AuthLike): AppRole | null {
  if (typeof input === 'object' && input !== null && 'auth' in input) {
    return (input as AuthLike).auth.role;
  }
  return input as AppRole | null;
}

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

export function isMerchantOrOwner(role: AppRole | null): boolean {
  return role === APP_ROLES.MERCHANT || role === APP_ROLES.PLATFORM_OWNER;
}

export function isBuyer(role: AppRole | null): boolean {
  return role === APP_ROLES.BUYER;
}

export function requireMerchantOrOwner(input: AppRole | null | AuthLike): AppRole {
  return requireRole(getRole(input), [APP_ROLES.MERCHANT, APP_ROLES.PLATFORM_OWNER]);
}
