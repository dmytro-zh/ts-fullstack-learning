import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const merchantOnlyPrefixes = ['/dashboard', '/products', '/orders', '/stores', '/checkout-links'];
const ownerOnlyPrefixes = ['/admin'];

function isPathPrefixed(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function buildLoginRedirect(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isOwnerOnly = isPathPrefixed(pathname, ownerOnlyPrefixes);
  const isMerchantOnly = isPathPrefixed(pathname, merchantOnlyPrefixes);

  if (!isOwnerOnly && !isMerchantOnly) return NextResponse.next();

  const token = req.cookies.get('api_token')?.value ?? null;
  if (!token) return buildLoginRedirect(req);

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|api/.*|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)',
  ],
};