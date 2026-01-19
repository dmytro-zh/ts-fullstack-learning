import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const merchantOnlyPrefixes = ['/dashboard', '/products', '/orders', '/stores', '/checkout-links'];
const ownerOnlyPrefixes = ['/admin'];
const authPages = ['/login', '/register'];

function isPathPrefixed(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function buildLoginRedirect(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

function buildPostAuthRedirect(req: NextRequest) {
  const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
  const safePath = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard';
  return NextResponse.redirect(new URL(safePath, req.nextUrl.origin));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isOwnerOnly = isPathPrefixed(pathname, ownerOnlyPrefixes);
  const isMerchantOnly = isPathPrefixed(pathname, merchantOnlyPrefixes);
  const isAuthPage = isPathPrefixed(pathname, authPages);

  const token = req.cookies.get('api_token')?.value ?? null;

  if (isAuthPage && token) return buildPostAuthRedirect(req);

  if (!isOwnerOnly && !isMerchantOnly) return NextResponse.next();

  if (!token) return buildLoginRedirect(req);

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api/.*|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)'],
};
