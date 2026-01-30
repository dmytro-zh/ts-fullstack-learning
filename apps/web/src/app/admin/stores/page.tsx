import { cookies } from 'next/headers';
import styles from '../admin.module.css';
import { StoreStatusButton } from '../store-status-button';

export const dynamic = 'force-dynamic';

type StoreRow = {
  id: string;
  name: string;
  ownerEmail: string | null;
  productsCount: number;
  revenue: number;
  isActive: boolean;
};

async function fetchStores(): Promise<StoreRow[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value ?? null;
  if (!token) return [];

  const apiBase = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const res = await fetch(`${apiBase}/admin/stores`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return [];
  const data = (await res.json()) as { ok: boolean; stores: StoreRow[] };
  return data.stores ?? [];
}

export default async function AdminStoresPage() {
  const stores = await fetchStores();

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Stores</h1>
          <p className={styles.subtitle}>Monitor store health and revenue.</p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Store</th>
              <th className={styles.th}>Owner</th>
              <th className={styles.th}>Products</th>
              <th className={styles.th}>Revenue</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className={styles.row}>
                <td className={styles.td}>{s.name}</td>
                <td className={styles.td}>{s.ownerEmail ?? '-'}</td>
                <td className={styles.td}>{s.productsCount}</td>
                <td className={styles.td}>${s.revenue.toFixed(2)}</td>
                <td className={styles.td}>{s.isActive ? 'Active' : 'Blocked'}</td>
                <td className={styles.td}>
                  <StoreStatusButton id={s.id} isActive={s.isActive} />
                </td>
              </tr>
            ))}
            {stores.length === 0 ? (
              <tr>
                <td style={{ padding: '12px 6px', color: '#94a3b8' }} colSpan={6}>
                  No stores found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
