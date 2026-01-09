'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared';

const baseLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  padding: '6px 11px',
  borderRadius: 999,
  color: '#4b5563',
  border: '1px solid transparent',
};

export type MeResponse =
  | { ok: true; user: null }
  | { ok: true; user: { id: string; role: AppRole | string | null } }
  | { ok: false; error?: string };

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

function isAppRole(value: unknown): value is AppRole {
  return (
    value === APP_ROLES.PLATFORM_OWNER ||
    value === APP_ROLES.MERCHANT ||
    value === APP_ROLES.BUYER
  );
}

function getRoleFromMeResponse(data: MeResponse | null): AppRole | null {
  if (!data || !data.ok) return null;
  const roleValue = data.user?.role ?? null;
  return isAppRole(roleValue) ? roleValue : null;
}

export function TopNav({ initialMe }: { initialMe?: MeResponse | null }) {
  // If server provided initialMe, we can render immediately with no skeleton.
  // Only show skeleton when initialMe is missing (eg. component used without TopNavServer).
  const [loading, setLoading] = useState(initialMe === undefined);
  const [role, setRole] = useState<AppRole | null>(() => getRoleFromMeResponse(initialMe ?? null));

  useEffect(() => {
    // If initialMe was provided (even if not authed), do not refetch on mount.
    if (initialMe !== undefined) return;

    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);

        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setRole(null);
          return;
        }

        const data = (await res.json()) as MeResponse;
        if (cancelled) return;

        setRole(getRoleFromMeResponse(data));
      } catch {
        if (!cancelled) setRole(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialMe]);

  if (loading) return <TopNavSkeleton />;

  const isAuthed = role !== null;
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
          onClick={() => {
            window.location.href = '/api/auth/logout';
          }}
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
