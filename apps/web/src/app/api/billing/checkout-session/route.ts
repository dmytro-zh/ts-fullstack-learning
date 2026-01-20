import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getUpstreamBaseUrl() {
  return process.env.API_URL?.replace(/\/+$/, '') ?? 'http://localhost:4000';
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value ?? null;

  const h = await headers();
  const incomingCookie = h.get('cookie') ?? '';
  const incomingAuth = h.get('authorization') ?? '';
  const body = await req.text();

  const upstream = await fetch(`${getUpstreamBaseUrl()}/billing/checkout-session`, {
    method: 'POST',
    headers: {
      'content-type': h.get('content-type') ?? 'application/json',
      ...(incomingCookie ? { cookie: incomingCookie } : {}),
      ...(incomingAuth ? { authorization: incomingAuth } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  const text = await upstream.text();

  const res = new NextResponse(text, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });

  const setCookie = upstream.headers.get('set-cookie');
  if (setCookie) res.headers.set('set-cookie', setCookie);

  return res;
}
