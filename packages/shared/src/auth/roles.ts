export const APP_ROLES = {
  PLATFORM_OWNER: 'PLATFORM_OWNER',
  MERCHANT: 'MERCHANT',
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export function isMerchant(role?: AppRole | null) {
  return role === APP_ROLES.MERCHANT;
}

export function isPlatformOwner(role?: AppRole | null) {
  return role === APP_ROLES.PLATFORM_OWNER;
}
