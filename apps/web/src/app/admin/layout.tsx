import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared';

export const runtime = 'nodejs';

function getUpstreamBaseUrl() {
  return process.env.API_URL?.replace(/\/+$/, '') ?? 'http://localhost:4000';
}

type UpstreamAuth = {
  userId: string | null;
  role: AppRole | string | null;
};

async function getAuth(): Promise<UpstreamAuth> {
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value ?? null;

  if (!token) return { userId: null, role: null };

  const res = await fetch(`${getUpstreamBaseUrl()}/debug/auth`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) return { userId: null, role: null };

  return (await res.json()) as UpstreamAuth;
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await getAuth();

  if (!auth.userId) {
    redirect('/login');
  }

  if (auth.role !== APP_ROLES.PLATFORM_OWNER) {
    redirect('/forbidden');
  }

  return <>{children}</>;
}
