export const APP_PLANS = {
  FREE: 'FREE',
  PRO: 'PRO',
} as const;

export type AppPlan = (typeof APP_PLANS)[keyof typeof APP_PLANS];

export const FREE_PLAN_LIMITS = {
  stores: 1,
  products: 10,
  checkoutLinks: 3,
} as const;
