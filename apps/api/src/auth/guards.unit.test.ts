import { describe, expect, it } from 'vitest';
import { GraphQLError } from 'graphql';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import {
  requireAuth,
  requireRole,
  requireMerchantOrOwner,
  isOwner,
  isMerchant,
  isMerchantOrOwner,
  isBuyer,
} from './guards';

describe('auth guards', () => {
  it('requireAuth throws UNAUTHENTICATED when userId is null', () => {
    try {
      requireAuth(null);
      throw new Error('Expected requireAuth to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(GraphQLError);
      const err = e as GraphQLError;
      expect(err.message).toBe('UNAUTHENTICATED');
      expect((err.extensions as any)?.code).toBe('UNAUTHENTICATED');
    }
  });

  it('requireAuth returns userId when present', () => {
    expect(requireAuth('u1')).toBe('u1');
  });

  it('requireRole throws UNAUTHENTICATED when role is null', () => {
    try {
      requireRole(null, [APP_ROLES.MERCHANT]);
      throw new Error('Expected requireRole to throw');
    } catch (e) {
      const err = e as GraphQLError;
      expect(err.message).toBe('UNAUTHENTICATED');
      expect((err.extensions as any)?.code).toBe('UNAUTHENTICATED');
    }
  });

  it('requireRole throws FORBIDDEN when role is not allowed', () => {
    try {
      requireRole(APP_ROLES.BUYER, [APP_ROLES.MERCHANT]);
      throw new Error('Expected requireRole to throw');
    } catch (e) {
      const err = e as GraphQLError;
      expect(err.message).toBe('FORBIDDEN');
      expect((err.extensions as any)?.code).toBe('FORBIDDEN');
    }
  });

  it('requireRole returns role when allowed', () => {
    expect(requireRole(APP_ROLES.MERCHANT, [APP_ROLES.MERCHANT])).toBe(APP_ROLES.MERCHANT);
  });

  it('requireMerchantOrOwner accepts ctx', () => {
    expect(requireMerchantOrOwner({ auth: { role: APP_ROLES.MERCHANT } })).toBe(APP_ROLES.MERCHANT);
  });

  it('requireMerchantOrOwner accepts role directly', () => {
    expect(requireMerchantOrOwner(APP_ROLES.PLATFORM_OWNER)).toBe(APP_ROLES.PLATFORM_OWNER);
  });

  it('isOwner and isMerchant', () => {
    expect(isOwner(APP_ROLES.PLATFORM_OWNER)).toBe(true);
    expect(isOwner(APP_ROLES.MERCHANT)).toBe(false);

    expect(isMerchant(APP_ROLES.MERCHANT)).toBe(true);
    expect(isMerchant(APP_ROLES.BUYER)).toBe(false);
  });

  it('isMerchantOrOwner and isBuyer', () => {
    expect(isMerchantOrOwner(APP_ROLES.MERCHANT)).toBe(true);
    expect(isMerchantOrOwner(APP_ROLES.PLATFORM_OWNER)).toBe(true);
    expect(isMerchantOrOwner(APP_ROLES.BUYER)).toBe(false);

    expect(isBuyer(APP_ROLES.BUYER)).toBe(true);
    expect(isBuyer(APP_ROLES.MERCHANT)).toBe(false);
  });
});
