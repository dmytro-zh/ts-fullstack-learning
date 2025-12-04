import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import {
  OrdersByStoreDocument,
  type OrdersByStoreQuery,
} from '../../graphql/generated/graphql';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function fetchOrders(storeId: string) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  return client.request<OrdersByStoreQuery>(OrdersByStoreDocument, { storeId });
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const storeId =
    typeof params?.storeId === 'string' ? params.storeId : undefined;

  if (!storeId) {
    return (
      <main style={{ padding: 32, background: '#f7f7f8', minHeight: '100vh' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', color: '#111827' }}>
          <h1>Orders</h1>
          <p>Pass ?storeId=... in the URL to view orders.</p>
        </div>
      </main>
    );
  }

  let orders: OrdersByStoreQuery['orders'] = [];
  try {
    const data = await fetchOrders(storeId);
    orders = data.orders;
  } catch {
    return (
      <main style={{ padding: 32, background: '#f7f7f8', minHeight: '100vh' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', color: '#111827' }}>
          <h1>Orders</h1>
          <p>Failed to load orders.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 32, background: '#f7f7f8', minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>Orders</h1>
        {orders.length === 0 ? (
          <p>No orders yet for this store.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {orders.map((o) => (
              <li
                key={o.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  background: '#fff',
                  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong>{o.product.name} × {o.quantity}</strong>
                  <span style={{ color: '#6b7280' }}>
                    {o.status} · {new Date(o.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ color: '#0f172a' }}>
                  Total: ${o.total.toFixed(2)}
                  {o.checkoutLink?.slug ? ` · Link: /c/${o.checkoutLink.slug}` : ''}
                </div>
                <div style={{ color: '#111827' }}>
                  Buyer: {o.customerName} ({o.email})
                </div>
                {o.shippingNote ? (
                  <div style={{ color: '#334155' }}>Note: {o.shippingNote}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
