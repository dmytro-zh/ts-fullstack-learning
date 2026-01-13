import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { AppRole } from '@ts-fullstack-learning/shared';

export const runtime = 'nodejs';

function getUpstreamBaseUrl() {
  return process.env.API_URL?.replace(/\/+$/, '') ?? 'http://localhost:4000';
}

type UpstreamAuth = {
  userId: string | null;
  role: AppRole | string | null;
};

type MeResponse =
  | { ok: true; user: null }
  | { ok: true; user: { id: string; role: AppRole | string | null } };

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value ?? null;

  const upstream = await fetch(`${getUpstreamBaseUrl()}/debug/auth`, {
    method: 'GET',
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      accept: 'application/json',
    },
    cache: 'no-store',
  });

  // If upstream is unhealthy - keep the upstream response (useful for debugging)
  if (!upstream.ok) {
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  }

  const data = (await upstream.json()) as UpstreamAuth;

  const me: MeResponse =
    data.userId && data.role
      ? { ok: true, user: { id: data.userId, role: data.role } }
      : { ok: true, user: null };

  return NextResponse.json(me, { status: 200 });
}
