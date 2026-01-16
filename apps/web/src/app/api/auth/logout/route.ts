import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const out = NextResponse.redirect(new URL('/', request.url));
  out.cookies.set('api_token', '', { path: '/', maxAge: 0 });
  return out;
}
