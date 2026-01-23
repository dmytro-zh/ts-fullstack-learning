import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getUpstreamBaseUrl() {
  return process.env.API_URL?.replace(/\/+$/, '') ?? 'http://localhost:4000';
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value ?? null;

  const h = await headers();
  const incomingCookie = h.get('cookie') ?? '';
  const incomingAuth = h.get('authorization') ?? '';

  const upstream = await fetch(`${getUpstreamBaseUrl()}/account/me`, {
    method: 'GET',
    headers: {
      ...(incomingCookie ? { cookie: incomingCookie } : {}),
      ...(incomingAuth ? { authorization: incomingAuth } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      accept: 'application/json',
    },
    cache: 'no-store',
  });

  const text = await upstream.text();

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}
