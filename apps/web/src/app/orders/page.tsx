import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import { OrdersByStoreDocument, type OrdersByStoreQuery } from '../../graphql/generated/graphql';
import { OrdersList } from './OrdersList';

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
  const storeId = typeof params?.storeId === 'string' ? params.storeId : undefined;

  if (!storeId) {
    return (
      <main style={{ padding: 32, background: '#f7f7f8', minHeight: '100vh' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', color: '#111827' }}>
          <h1 style={{ margin: 0 }}>Orders</h1>
          <p style={{ marginTop: 8 }}>Pass ?storeId=... in the URL to view orders.</p>
        </div>
      </main>
    );
  }

  let orders: OrdersByStoreQuery['orders'] = [];

  try {
    const data = await fetchOrders(storeId);
    orders = data.orders;
  } catch (err) {
    console.error('Failed to load orders for store', storeId, err);
    return (
      <main style={{ padding: 32, background: '#f7f7f8', minHeight: '100vh' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', color: '#111827' }}>
          <h1 style={{ margin: 0 }}>Orders</h1>
          <p style={{ marginTop: 8 }}>Failed to load orders.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 32, background: '#f7f7f8', minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>Orders</h1>
        <OrdersList initialOrders={orders} />
      </div>
    </main>
  );
}
