import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared';
import styles from './admin.module.css';

export const runtime = 'nodejs';

function getUpstreamBaseUrl() {
  return process.env.API_URL?.replace(/\/+$/, '') ?? 'http://localhost:4000';
}

type UpstreamAuth = {
  userId: string | null;
  role: AppRole | string | null;
};

async function getAuth(): Promise<UpstreamAuth> {
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value ?? null;

  if (!token) return { userId: null, role: null };

  const res = await fetch(`${getUpstreamBaseUrl()}/debug/auth`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) return { userId: null, role: null };

  return (await res.json()) as UpstreamAuth;
}

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const auth = await getAuth();

  if (!auth.userId) {
    redirect('/login');
  }

  if (auth.role !== APP_ROLES.PLATFORM_OWNER) {
    redirect('/forbidden');
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Admin</div>
          <nav className={styles.nav}>
            <Link href="/admin" className={styles.navLink}>
              Overview
            </Link>
            <Link href="/admin/merchants" className={styles.navLink}>
              Merchants
            </Link>
            <Link href="/admin/stores" className={styles.navLink}>
              Stores
            </Link>
          </nav>
        </aside>

        <section className={styles.content}>{children}</section>
      </div>
    </div>
  );
}
