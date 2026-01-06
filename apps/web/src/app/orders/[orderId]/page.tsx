import Link from 'next/link';
import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../../lib/env';
import {
  StoresOverviewDocument,
  StoreOrdersDocument,
  type StoresOverviewQuery,
  type StoreOrdersQuery,
} from '../../../graphql/generated/graphql';

export const dynamic = 'force-dynamic';

type OrderDetailsPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function fetchStores(): Promise<StoresOverviewQuery> {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  return client.request<StoresOverviewQuery>(StoresOverviewDocument);
}

async function fetchStoreOrders(storeId: string): Promise<StoreOrdersQuery> {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  return client.request<StoreOrdersQuery>(StoreOrdersDocument, { storeId });
}

export default async function OrderDetailsPage({ params, searchParams }: OrderDetailsPageProps) {
  const { orderId } = await params;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const storeParam = resolvedSearchParams?.store;
  const storeId = typeof storeParam === 'string' ? storeParam : undefined;

  // No storeId in URL
  if (!storeId) {
    return (
      <main
        style={{
          padding: '32px 16px 40px',
          minHeight: '100vh',
          boxSizing: 'border-box',
          color: '#020617',
        }}
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
              fontSize: 22,
              letterSpacing: -0.03,
            }}
          >
            Order
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: '#4b5563',
            }}
          >
            No store selected for this order URL.
          </p>
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              gap: 8,
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
      >
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
          }}
        >
          Failed to load order.
        </div>
      </main>
    );
  }

  const stores = storesData.stores ?? [];
  const store = stores.find((s) => s.id === storeId) ?? null;
  const orders = ordersData.orders ?? [];
  const order = orders.find((o) => o.id === orderId) ?? null;

  if (!order) {
    return (
      <main
        style={{
          padding: '32px 16px 40px',
          minHeight: '100vh',
          boxSizing: 'border-box',
          color: '#020617',
        }}
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
              fontSize: 22,
              letterSpacing: -0.03,
            }}
          >
            Order not found
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: '#4b5563',
            }}
          >
            This order does not exist for the selected store.
          </p>
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              gap: 8,
            }}
          >
            <Link
              href={`/orders?store=${encodeURIComponent(storeId)}`}
              style={{
                padding: '9px 18px',
                borderRadius: 999,
                border: '1px solid rgba(209,213,219,0.9)',
                background: '#f9fafb',
                fontSize: 13,
                color: '#111827',
                textDecoration: 'none',
              }}
            >
              Back to orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Pretty label for createdAt
  let createdAtLabel = 'Unknown';
  if (order.createdAt) {
    const numeric = Number(order.createdAt);
    const date =
      Number.isNaN(numeric) && typeof order.createdAt === 'string'
        ? new Date(order.createdAt)
        : new Date(numeric);
    if (!Number.isNaN(date.getTime())) {
      createdAtLabel = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  // Quantity with safe fallback for old orders
  const quantity = order.quantity ?? 1;

  // Status label + color from backend enum
  const rawStatusKey = (order.status ?? 'PAID') as string;

  const statusLabelMap: Record<string, string> = {
    NEW: 'New',
    PENDING_PAYMENT: 'Pending payment',
    PAID: 'Paid',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    COMPLETED: 'Completed',
    CANCELLED: 'Canceled',
    REFUNDED: 'Refunded',
  };

  const statusColorMap: Record<string, string> = {
    NEW: '#6b7280',
    PENDING_PAYMENT: '#ca8a04',
    PAID: '#16a34a',
    PROCESSING: '#0284c7',
    SHIPPED: '#4f46e5',
    COMPLETED: '#15803d',
    CANCELLED: '#b91c1c',
    REFUNDED: '#0f766e',
  };

  const statusLabel = statusLabelMap[rawStatusKey] ?? 'Paid';
  const statusColor = statusColorMap[rawStatusKey] ?? '#16a34a';

  return (
    <main
      style={{
        padding: '32px 16px 40px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        color: '#020617',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
        }}
      >
        <section
          style={{
            borderRadius: 22,
            border: '1px solid rgba(209,213,219,0.95)',
            background: '#ffffff',
            padding: 20,
            display: 'grid',
            gap: 16,
          }}
        >
          {/* Top row: title + actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                }}
              >
                Order
              </span>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  letterSpacing: -0.03,
                }}
              >
                {order.product?.name ?? 'Order'} · ${order.total.toFixed(2)}
              </h1>
              {store && (
                <span
                  style={{
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  {store.name}
                </span>
              )}
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
                href={`/orders?store=${encodeURIComponent(storeId)}`}
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
                Back to orders
              </Link>
              <Link
                href={`/dashboard?store=${encodeURIComponent(storeId)}`}
                style={{
                  padding: '7px 13px',
                  borderRadius: 999,
                  border: '1px solid #1d4ed8',
                  background: 'linear-gradient(135deg, #2563eb 0, #1d4ed8 100%)',
                  fontSize: 12,
                  color: '#f9fafb',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Back to dashboard
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: 'rgba(229,231,235,0.9)',
            }}
          />

          {/* Order details grid */}
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                }}
              >
                Store
              </span>
              <span
                style={{
                  fontSize: 13,
                }}
              >
                {store?.name ?? 'Unknown store'}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                }}
              >
                Order ID
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  wordBreak: 'break-all',
                }}
              >
                {order.id}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                }}
              >
                Product
              </span>
              <span
                style={{
                  fontSize: 13,
                }}
              >
                {order.product?.name ?? 'Unknown product'}
              </span>
            </div>

            {/* Quantity block */}
            <div
              style={{
                display: 'grid',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                }}
              >
                Quantity
              </span>
              <span
                style={{
                  fontSize: 13,
                }}
              >
                {quantity}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                }}
              >
                Total
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
                display: 'grid',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                }}
              >
                Created at
              </span>
              <span
                style={{
                  fontSize: 13,
                }}
              >
                {createdAtLabel}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                }}
              >
                Status
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: statusColor,
                }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
