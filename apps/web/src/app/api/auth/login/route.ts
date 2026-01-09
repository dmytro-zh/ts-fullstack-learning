import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getUpstreamBaseUrl() {
  return process.env.API_URL?.replace(/\/+$/, '') ?? 'http://localhost:4000';
}

export async function POST(req: Request) {
  const body = await req.text();

  const upstream = await fetch(`${getUpstreamBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': req.headers.get('content-type') ?? 'application/json',
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

  if (!upstream.ok) return res;

  // Try to read token from response JSON
  let token: string | null = null;
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    const t =
      (typeof data.token === 'string' && data.token) ||
      (typeof data.accessToken === 'string' && data.accessToken) ||
      (typeof data.apiToken === 'string' && data.apiToken) ||
      (typeof data.jwt === 'string' && data.jwt) ||
      null;
    token = t;
  } catch {
    token = null;
  }

  if (token) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookies.set('api_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      // maxAge: 60 * 60 * 24 * 7, // optionally 7 days
    });
  }

  return res;
}