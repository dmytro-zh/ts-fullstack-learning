import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

type Role = 'PLATFORM_OWNER' | 'MERCHANT' | 'BUYER';

const merchantOnlyPrefixes = [
  '/dashboard',
  '/products',
  '/orders',
  '/stores',
  '/checkout-links',
];

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

  if (!isOwnerOnly && !isMerchantOnly) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    // NextAuth uses NEXTAUTH_SECRET under the hood.
    // If you use a different name, set it here.
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return buildLoginRedirect(req);
  }

  const role = (token as unknown as { role?: Role }).role;

  // If role is not present yet, treat as unauthenticated.
  // This prevents accidental access until role is wired into JWT/session.
  if (!role) {
    return buildLoginRedirect(req);
  }

  if (isOwnerOnly && role !== 'PLATFORM_OWNER') {
    const url = req.nextUrl.clone();
    url.pathname = '/forbidden';
    return NextResponse.redirect(url);
  }

  // Merchant area: allow MERCHANT and PLATFORM_OWNER
  if (isMerchantOnly && role !== 'MERCHANT' && role !== 'PLATFORM_OWNER') {
    const url = req.nextUrl.clone();
    url.pathname = '/forbidden';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
      Skip:
      - next internals
      - static files
      - auth routes
    */
    '/((?!_next|favicon.ico|api/auth|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)',
  ],
};
