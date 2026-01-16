import Link from 'next/link';
import { createWebGraphQLClient } from '../../lib/graphql-client';
import {
  StoresOverviewDocument,
  StoreOrdersDocument,
  type StoresOverviewQuery,
  type StoreOrdersQuery,
} from '../../graphql/generated/graphql';

export const dynamic = 'force-dynamic';

type OrdersPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function fetchStores(): Promise<StoresOverviewQuery> {
  const client = await createWebGraphQLClient();
  return client.request<StoresOverviewQuery>(StoresOverviewDocument);
}

async function fetchStoreOrders(storeId: string): Promise<StoreOrdersQuery> {
  const client = await createWebGraphQLClient();
  return client.request<StoreOrdersQuery>(StoreOrdersDocument, { storeId });
}

function formatOrderDate(createdAt?: string | null): string {
  if (!createdAt) return 'Unknown';

  const numeric = Number(createdAt);
  const date =
    Number.isNaN(numeric) && typeof createdAt === 'string'
      ? new Date(createdAt)
      : new Date(numeric);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const storeParam = resolvedSearchParams?.store;
  const storeId = typeof storeParam === 'string' ? storeParam : undefined;

  if (!storeId) {
    return (
      <main
        style={{
          padding: '32px 16px 40px',
          minHeight: '100vh',
          boxSizing: 'border-box',
          color: '#020617',
        }}
        data-testid="orders-page"
      >
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              letterSpacing: -0.03,
            }}
          >
            Orders
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: '#4b5563',
            }}
          >
            No store selected. Open the dashboard and pick a store first.
          </p>
          <div
            style={{
              marginTop: 14,
            }}
          >
            <Link
              href="/dashboard"
              style={{
                padding: '9px 18px',
                borderRadius: 999,
                border: '1px solid #1d4ed8',
                background: 'linear-gradient(135deg, #2563eb 0, #1d4ed8 100%)',
                fontSize: 13,
                fontWeight: 500,
                color: '#f9fafb',
                textDecoration: 'none',
              }}
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let storesData: StoresOverviewQuery;
  let ordersData: StoreOrdersQuery;

  try {
    const [storesResult, ordersResult] = await Promise.all([
      fetchStores(),
      fetchStoreOrders(storeId),
    ]);
    storesData = storesResult;
    ordersData = ordersResult;
  } catch {
    return (
      <main
        style={{
          padding: '32px 16px 40px',
          minHeight: '100vh',
          boxSizing: 'border-box',
          color: '#020617',
        }}
        data-testid="orders-page"
      >
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
          }}
        >
          Failed to load orders.
        </div>
      </main>
    );
  }

  const stores = storesData.stores ?? [];
  const store = stores.find((s) => s.id === storeId) ?? null;
  const orders = ordersData.orders ?? [];

  return (
    <main
      style={{
        padding: '32px 16px 40px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        color: '#020617',
      }}
      data-testid="orders-page"
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gap: 20,
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
              }}
            >
              Orders
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                letterSpacing: -0.03,
              }}
            >
              {store ? store.name : 'Selected store'}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: '#6b7280',
              }}
            >
              Every paid order for this store in one clear list.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <Link
              href={`/dashboard?store=${encodeURIComponent(storeId)}`}
              style={{
                padding: '7px 13px',
                borderRadius: 999,
                border: '1px solid rgba(209,213,219,0.9)',
                background: '#f9fafb',
                fontSize: 12,
                color: '#111827',
                textDecoration: 'none',
              }}
            >
              Back to dashboard
            </Link>
          </div>
        </header>

        <section
          style={{
            borderRadius: 22,
            border: '1px solid rgba(209,213,219,0.95)',
            background: '#ffffff',
            padding: 18,
            display: 'grid',
            gap: 10,
          }}
        >
          {orders.length === 0 ? (
            <div
              style={{
                borderRadius: 16,
                border: '1px dashed rgba(209,213,219,0.95)',
                background: '#f9fafb',
                padding: 14,
                fontSize: 13,
                color: '#6b7280',
                textAlign: 'center',
              }}
              data-testid="orders-empty"
            >
              No orders yet. Share a checkout link for this store and new orders will appear here.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 8,
              }}
              data-testid="orders-list"
            >
              {orders.map((order) => {
                const quantity = order.quantity ?? 1;
                const createdAtLabel = formatOrderDate(order.createdAt);

                return (
                  <Link
                    key={order.id}
                    href={`/orders/${encodeURIComponent(order.id)}?store=${encodeURIComponent(
                      storeId,
                    )}`}
                    style={{
                      borderRadius: 14,
                      border: '1px solid rgba(229,231,235,0.95)',
                      background: '#f9fafb',
                      padding: '9px 12px',
                      textDecoration: 'none',
                      color: '#0f172a',
                      display: 'grid',
                      gap: 2,
                    }}
                    data-testid="orders-item"
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        {order.product?.name ?? 'Order'} x {quantity}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: '#6b7280',
                        }}
                      >
                        {createdAtLabel}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#16a34a',
                        }}
                      >
                        Paid
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
