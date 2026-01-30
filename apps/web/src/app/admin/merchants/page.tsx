import { cookies } from 'next/headers';
import styles from '../admin.module.css';
import { MerchantPlanButton } from '../merchant-plan-button';

export const dynamic = 'force-dynamic';

type Merchant = {
  id: string;
  email: string;
  plan: 'FREE' | 'PRO';
  subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | null;
  storesCount: number;
};

async function fetchMerchants(): Promise<Merchant[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value ?? null;
  if (!token) return [];

  const apiBase = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const res = await fetch(`${apiBase}/admin/merchants`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return [];
  const data = (await res.json()) as { ok: boolean; merchants: Merchant[] };
  return data.merchants ?? [];
}

export default async function AdminMerchantsPage() {
  const merchants = await fetchMerchants();

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Merchants</h1>
          <p className={styles.subtitle}>Manage merchant accounts and plans.</p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Plan</th>
              <th className={styles.th}>Subscription</th>
              <th className={styles.th}>Stores</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m.id} className={styles.row}>
                <td className={styles.td}>{m.email}</td>
                <td className={styles.td}>{m.plan}</td>
                <td className={styles.td}>{m.subscriptionStatus ?? '-'}</td>
                <td className={styles.td}>{m.storesCount}</td>
                <td className={styles.td}>
                  <MerchantPlanButton id={m.id} plan={m.plan} />
                </td>
              </tr>
            ))}
            {merchants.length === 0 ? (
              <tr>
                <td style={{ padding: '12px 6px', color: '#94a3b8' }} colSpan={5}>
                  No merchants found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
