import { NextResponse } from 'next/server';

export async function GET() {
  const out = NextResponse.redirect(new URL('/', 'http://localhost:3000'));
  out.cookies.set('api_token', '', { path: '/', maxAge: 0 });
  return out;
}
