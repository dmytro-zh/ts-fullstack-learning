import { cookies, headers } from 'next/headers';
import { TopNav, type MeResponse } from './TopNav';

async function getMe(): Promise<MeResponse | null> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return null;

  const cookie = (await cookies()).toString();

  const res = await fetch(`${proto}://${host}/api/auth/me`, {
    headers: { cookie },
    cache: 'no-store',
  });

  if (!res.ok) return { ok: false };
  return (await res.json()) as MeResponse;
}

export async function TopNavServer() {
  const me = await getMe();
  return <TopNav initialMe={me} />;
}
