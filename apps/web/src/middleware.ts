import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared/auth/roles';

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

function buildForbiddenRedirect(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/forbidden';
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isOwnerOnly = isPathPrefixed(pathname, ownerOnlyPrefixes);
  const isMerchantOnly = isPathPrefixed(pathname, merchantOnlyPrefixes);

  if (!isOwnerOnly && !isMerchantOnly) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) return buildLoginRedirect(req);

  const role = (token as { role?: AppRole }).role;
  if (!role) return buildLoginRedirect(req);

  if (isOwnerOnly && role !== APP_ROLES.PLATFORM_OWNER) {
    return buildForbiddenRedirect(req);
  }

  if (isMerchantOnly && role !== APP_ROLES.MERCHANT && role !== APP_ROLES.PLATFORM_OWNER) {
    return buildForbiddenRedirect(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|api/auth|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)',
  ],
};
