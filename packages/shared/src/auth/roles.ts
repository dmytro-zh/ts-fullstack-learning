export const APP_ROLES = {
  PLATFORM_OWNER: 'PLATFORM_OWNER',
  MERCHANT: 'MERCHANT',
  BUYER: 'BUYER',
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export function isBuyer(role?: AppRole | null) {
  return role === APP_ROLES.BUYER;
}

export function isMerchant(role?: AppRole | null) {
  return role === APP_ROLES.MERCHANT;
}

export function isPlatformOwner(role?: AppRole | null) {
  return role === APP_ROLES.PLATFORM_OWNER;
}
