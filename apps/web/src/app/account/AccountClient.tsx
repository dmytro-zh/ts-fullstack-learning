'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Text } from '../../components/ui/Text';
import styles from './page.module.css';

type AccountMe = {
  ok: true;
  user: {
    email: string;
    role: string | null;
    plan: 'FREE' | 'PRO';
    subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | null;
  };
};

type AccountClientProps = {
  initialAccount?: AccountMe | null;
  initialAccountError?: string | null;
};

function formatLabel(value: string | null) {
  if (!value) return '—';
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function AccountClient({
  initialAccount = null,
  initialAccountError = null,
}: AccountClientProps) {
  const [account, setAccount] = useState<AccountMe | null>(initialAccount);
  const [accountError, setAccountError] = useState<string | null>(initialAccountError);
  const [loading, setLoading] = useState(initialAccount === null && !initialAccountError);

  useEffect(() => {
    if (initialAccount !== null || initialAccountError) return;

    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/account/me', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setAccountError('Failed to load account info.');
          return;
        }
        const data = (await res.json()) as AccountMe;
        if (!cancelled) setAccount(data);
      } catch {
        if (!cancelled) setAccountError('Failed to load account info.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialAccount, initialAccountError]);

  const user = account?.user ?? null;
  const billingLabel = user?.role === 'MERCHANT' ? 'Manage billing' : 'View billing';
  const roleLabel = useMemo(() => formatLabel(user?.role ?? null), [user?.role]);
  const statusLabel = useMemo(
    () => formatLabel(user?.subscriptionStatus ?? null),
    [user?.subscriptionStatus],
  );

  return (
    <main className={styles.page} data-testid="account-page">
      <div className={styles.container}>
        <section className={styles.panel}>
          <div className={styles.header}>
            <Text as="h1" variant="title" className={styles.heading}>
              Account
            </Text>
            <Text as="p" variant="muted" className={styles.subheading}>
              Profile and billing access.
            </Text>
          </div>

          {accountError ? <div className={styles.bannerError}>{accountError}</div> : null}
          {loading ? <Text variant="muted">Loading...</Text> : null}

          {user ? (
            <div className={styles.card}>
              <div className={styles.row}>
                <Text variant="label" className={styles.label}>
                  Email
                </Text>
                <Text className={styles.value}>{user.email}</Text>
              </div>
              <div className={styles.row}>
                <Text variant="label" className={styles.label}>
                  Role
                </Text>
                <Text className={styles.value}>{roleLabel}</Text>
              </div>
              <div className={styles.row}>
                <Text variant="label" className={styles.label}>
                  Plan
                </Text>
                <Text className={styles.value}>{user.plan}</Text>
              </div>
              <div className={styles.row}>
                <Text variant="label" className={styles.label}>
                  Subscription
                </Text>
                <Text className={styles.value}>{statusLabel}</Text>
              </div>
              <div className={styles.row}>
                <Text variant="label" className={styles.label}>
                  Billing
                </Text>
                <Link href="/billing" className={styles.link}>
                  {billingLabel}
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
