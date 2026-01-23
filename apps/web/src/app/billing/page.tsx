import BillingClient from './BillingClient';
import { cookies } from 'next/headers';

type BillingMe = {
  ok: true;
  plan: 'FREE' | 'PRO';
  subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

async function fetchBillingMe(token: string): Promise<BillingMe> {
  const baseUrl = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/billing/me`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Billing fetch failed: ${res.status}`);
  }

  return (await res.json()) as BillingMe;
}

export default async function BillingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value ?? null;
  let initialBilling: BillingMe | null = null;
  let initialBillingError: string | null = null;

  if (!token) {
    initialBillingError = 'Unauthorized';
  } else {
    try {
      initialBilling = await fetchBillingMe(token);
    } catch {
      initialBillingError = 'Failed to load billing status.';
    }
  }

  return (
    <BillingClient initialBilling={initialBilling} initialBillingError={initialBillingError} />
  );
}
