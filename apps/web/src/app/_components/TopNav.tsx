'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared';

const baseLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  padding: '6px 11px',
  borderRadius: 999,
  color: '#4b5563',
  border: '1px solid transparent',
};

function TopNavSkeleton() {
  const pill: React.CSSProperties = {
    height: 28,
    borderRadius: 999,
    border: '1px solid rgba(148,163,184,0.25)',
    background: 'rgba(148,163,184,0.12)',
  };

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
      <div style={{ ...pill, width: 74 }} />
      <div style={{ ...pill, width: 64 }} />
      <div style={{ ...pill, width: 86 }} />
      <div style={{ ...pill, width: 118 }} />
      <div style={{ width: 6 }} />
      <div style={{ ...pill, width: 72 }} />
    </nav>
  );
}

export function TopNav() {
  const { data, status } = useSession();

  if (status === 'loading') {
    return <TopNavSkeleton />;
  }

  const role = (data?.user as { role?: AppRole } | undefined)?.role;
  const isAuthed = status === 'authenticated';
  const canSeeAdmin = role === APP_ROLES.PLATFORM_OWNER;

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
      {isAuthed ? (
        <>
          <Link href="/products" style={baseLinkStyle}>
            Products
          </Link>
          <Link href="/stores" style={baseLinkStyle}>
            Stores
          </Link>
          <Link href="/dashboard" style={baseLinkStyle}>
            Dashboard
          </Link>

          <Link
            href="/checkout-links"
            style={{
              textDecoration: 'none',
              padding: '7px 14px',
              borderRadius: 999,
              border: '1px solid rgba(37,99,235,0.9)',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#f9fafb',
              fontWeight: 600,
              boxShadow: '0 10px 26px rgba(37,99,235,0.30)',
              whiteSpace: 'nowrap',
            }}
          >
            Checkout links
          </Link>

          {canSeeAdmin ? (
            <Link
              href="/admin"
              style={{
                ...baseLinkStyle,
                border: '1px solid rgba(148,163,184,0.35)',
                background: 'rgba(255,255,255,0.75)',
                color: '#111827',
              }}
            >
              Admin
            </Link>
          ) : null}

          <div style={{ width: 6 }} />
        </>
      ) : null}

      {!isAuthed ? (
        <Link
          href="/login"
          style={{
            ...baseLinkStyle,
            border: '1px solid rgba(148,163,184,0.35)',
            background: 'rgba(255,255,255,0.75)',
            color: '#111827',
            fontWeight: 600,
          }}
        >
          Sign in
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: '/' })}
          style={{
            padding: '6px 11px',
            borderRadius: 999,
            border: '1px solid rgba(148,163,184,0.45)',
            background: 'rgba(255,255,255,0.75)',
            color: '#111827',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      )}
    </nav>
  );
}
