'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared';

type MeResponse =
  | { ok: true; user: null }
  | { ok: true; user: { id: string; role: AppRole | string | null } };

function isAppRole(value: unknown): value is AppRole {
  return (
    value === APP_ROLES.PLATFORM_OWNER ||
    value === APP_ROLES.MERCHANT ||
    value === APP_ROLES.BUYER
  );
}

function getRoleFromMeResponse(data: MeResponse): AppRole | null {
  const roleValue = data.user?.role ?? null;
  return isAppRole(roleValue) ? roleValue : null;
}

export function AdminNavLink() {
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (role !== APP_ROLES.PLATFORM_OWNER) return null;

  return (
    <Link
      href="/admin"
      style={{
        textDecoration: 'none',
        padding: '6px 11px',
        borderRadius: 999,
        color: '#4b5563',
        border: '1px solid transparent',
      }}
    >
      Admin
    </Link>
  );
}
