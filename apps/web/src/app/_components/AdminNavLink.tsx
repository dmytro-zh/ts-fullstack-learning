'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared/auth/roles';

export function AdminNavLink() {
  const { data } = useSession();
  const role = (data?.user as { role?: AppRole } | undefined)?.role;

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
