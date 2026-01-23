import AccountClient from './AccountClient';
import { cookies } from 'next/headers';

type AccountMe = {
  ok: true;
  user: {
    email: string;
    role: 'BUYER' | 'MERCHANT' | 'PLATFORM_OWNER' | string | null;
    plan: 'FREE' | 'PRO';
    subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | null;
  };
};

async function fetchAccountMe(token: string): Promise<AccountMe> {
  const baseUrl = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/account/me`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Account fetch failed: ${res.status}`);
  }

  return (await res.json()) as AccountMe;
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value ?? null;

  let initialAccount: AccountMe | null = null;
  let initialAccountError: string | null = null;

  if (!token) {
    initialAccountError = 'Unauthorized';
  } else {
    try {
      initialAccount = await fetchAccountMe(token);
    } catch {
      initialAccountError = 'Failed to load account info.';
    }
  }

  return (
    <AccountClient initialAccount={initialAccount} initialAccountError={initialAccountError} />
  );
}
