import styles from './admin.module.css';
import { headers } from 'next/headers';

type MetricsResponse = {
  ok: true;
  periodDays: number;
  since: string;
  activeProCount: number;
  pastDueCount: number;
  canceledCount: number;
  newMerchantsCount: number;
  mrrCents: number;
  ordersCount: number;
  revenueCents: number;
  aovCents: number;
};

function formatCad(cents: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 2,
  }).format((cents ?? 0) / 100);
}

function getBaseUrl(h: Awaited<ReturnType<typeof headers>>) {
  const envBase =
    process.env.NEXT_PUBLIC_WEB_BASE_URL ??
    process.env.WEB_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    '';
  if (envBase.trim().length > 0) {
    return envBase.replace(/\/+$/g, '');
  }

  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

export default async function AdminOverviewPage() {
  const h = await headers();
  const baseUrl = getBaseUrl(h);
  const cookieHeader = h.get('cookie') ?? '';
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  });

  const data = res.ok
    ? ((await res.json()) as MetricsResponse)
    : {
        ok: false,
        periodDays: 30,
        since: new Date().toISOString(),
        activeProCount: 0,
        pastDueCount: 0,
        canceledCount: 0,
        newMerchantsCount: 0,
        mrrCents: 0,
        ordersCount: 0,
        revenueCents: 0,
        aovCents: 0,
      };

  return (
    <div data-testid="admin-page">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title} data-testid="admin-title">
            Overview
          </h1>
          <p className={styles.subtitle}>Platform health for the last {data.periodDays} days.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Estimated MRR</div>
          <div className={styles.statValue}>{formatCad(data.mrrCents)}</div>
          <div className={styles.statSubtext}>Active Pro × fixed price</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active Pro</div>
          <div className={styles.statValue}>{data.activeProCount}</div>
          <div className={styles.statSubtext}>
            Past due: {data.pastDueCount} · Canceled: {data.canceledCount}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Revenue (paid)</div>
          <div className={styles.statValue}>{formatCad(data.revenueCents)}</div>
          <div className={styles.statSubtext}>Orders: {data.ordersCount}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Avg order value</div>
          <div className={styles.statValue}>{formatCad(data.aovCents)}</div>
          <div className={styles.statSubtext}>Paid orders only</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>New merchants</div>
          <div className={styles.statValue}>{data.newMerchantsCount}</div>
          <div className={styles.statSubtext}>Last {data.periodDays} days</div>
        </div>
      </div>
    </div>
  );
}
