import Link from 'next/link';
import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import {
  StoresOverviewDocument,
  StoreDashboardDocument,
  type StoresOverviewQuery,
  type StoreDashboardQuery,
} from '../../graphql/generated/graphql';

import type React from 'react';

const itemCardBaseStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(229,231,235,0.95)',
  background: '#f9fafb',
  padding: '8px 10px',
};

export const dynamic = 'force-dynamic';

type DashboardPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function fetchStores(): Promise<StoresOverviewQuery> {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  return client.request<StoresOverviewQuery>(StoresOverviewDocument);
}

async function fetchStoreDashboard(storeId: string): Promise<StoreDashboardQuery> {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  return client.request<StoreDashboardQuery>(StoreDashboardDocument, {
    storeId,
  });
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

function getTimestamp(value?: string | null): number {
  if (!value) return 0;
  const numeric = Number(value);

  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  return 0;
}

function isNewProduct(createdAt?: string | null): boolean {
  const ts = getTimestamp(createdAt);
  if (!ts) return false;

  const now = Date.now();
  const diffMs = now - ts;
  const hours = diffMs / (1000 * 60 * 60);

  return hours <= 24;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const storeParam = params?.store;
  const initialStoreId = typeof storeParam === 'string' ? storeParam : undefined;

  let storesData: StoresOverviewQuery;

  try {
    storesData = await fetchStores();
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
          Failed to load dashboard data.
        </div>
      </main>
    );
  }

  const stores = storesData.stores ?? [];
  const hasStores = stores.length > 0;

  const activeStore =
    (hasStores && stores.find((s) => s.id === initialStoreId)) || stores[0] || null;

  let dashboardData: StoreDashboardQuery | null = null;

  if (activeStore) {
    try {
      dashboardData = await fetchStoreDashboard(activeStore.id);
    } catch {
      dashboardData = null;
    }
  }

  const allProducts = dashboardData?.products ?? [];
  const storeProducts =
    activeStore != null
      ? allProducts
          .filter((p) => p.storeId === activeStore.id)
          .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))
          .slice(0, 3)
      : [];

  const storeOrders = dashboardData?.orders
    ? [...dashboardData.orders]
        .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))
        .slice(0, 3)
    : [];

  const hasProducts = storeProducts.length > 0;
  const hasOrders = storeOrders.length > 0;

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const storeProductCount =
    activeStore != null ? allProducts.filter((p) => p.storeId === activeStore.id).length : 0;

  const recentOrders = dashboardData?.orders
    ? dashboardData.orders.filter((o) => {
        const ts = getTimestamp(o.createdAt);
        if (!ts) return false;
        const diff = now - ts;
        return diff >= 0 && diff <= thirtyDaysMs;
      })
    : [];

  const recentOrdersCount = recentOrders.length;
  const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

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
          display: 'grid',
          gap: 24,
        }}
      >
        <section
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
              Dashboard
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                letterSpacing: -0.03,
              }}
            >
              One place for tiny stores and orders.
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: '#6b7280',
              }}
            >
              Pick a store, see its products, and keep an eye on fresh orders in one calm view.
            </p>
          </div>
        </section>

        {!hasStores && (
          <section
            style={{
              marginTop: 8,
              borderRadius: 24,
              border: '1px solid rgba(209,213,219,0.95)',
              background: '#f9fafb',
              padding: 26,
              display: 'grid',
              gap: 10,
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                letterSpacing: -0.02,
              }}
            >
              You do not have any stores yet.
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: '#4b5563',
              }}
            >
              Start with one quiet corner. Give it a name, add a product, and you are ready to share
              a checkout link.
            </p>
            <div
              style={{
                marginTop: 10,
              }}
            >
              <Link
                href="/stores"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 20px',
                  borderRadius: 999,
                  border: '1px solid #1d4ed8',
                  background: 'linear-gradient(135deg, #2563eb 0, #1d4ed8 100%)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#f9fafb',
                  textDecoration: 'none',
                  boxShadow: '0 14px 30px rgba(37,99,235,0.35)',
                }}
              >
                Create your first store
              </Link>
            </div>
          </section>
        )}

        {hasStores && activeStore && (
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)',
              gap: 18,
              alignItems: 'flex-start',
            }}
          >
            <aside
              style={{
                borderRadius: 20,
                border: '1px solid rgba(209,213,219,0.9)',
                background: '#f9fafb',
                padding: 14,
                display: 'grid',
                gap: 12,
              }}
            >
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
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Stores
                </span>
                <Link
                  href="/stores"
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(148,163,184,0.9)',
                    background: '#ffffff',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#111827',
                    textDecoration: 'none',
                  }}
                >
                  New store
                </Link>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {stores.map((store) => {
                  const isActive = store.id === activeStore.id;
                  const href = `/dashboard?store=${encodeURIComponent(store.id)}`;

                  return (
                    <Link
                      key={store.id}
                      href={href}
                      style={{
                        borderRadius: 999,
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        textDecoration: 'none',
                        background: isActive ? '#eff6ff' : '#ffffff',
                        color: '#0f172a',
                        border: isActive ? '1px solid #bfdbfe' : '1px solid rgba(209,213,219,0.9)',
                        boxShadow: isActive ? '0 10px 22px rgba(37,99,235,0.25)' : 'none',
                        transition:
                          'background 150ms ease-out, box-shadow 150ms ease-out, border-color 150ms ease-out',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {store.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </aside>

            <div
              style={{
                display: 'grid',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(209,213,219,0.9)',
                    background: '#ffffff',
                    padding: 12,
                    display: 'grid',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: '#6b7280',
                    }}
                  >
                    Products
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    {storeProductCount}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#9ca3af',
                    }}
                  >
                    Total in this store
                  </span>
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(209,213,219,0.9)',
                    background: '#ffffff',
                    padding: 12,
                    display: 'grid',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: '#6b7280',
                    }}
                  >
                    Orders (30 days)
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    {recentOrdersCount}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#9ca3af',
                    }}
                  >
                    Recent orders
                  </span>
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(209,213,219,0.9)',
                    background: '#ffffff',
                    padding: 12,
                    display: 'grid',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: '#6b7280',
                    }}
                  >
                    Revenue (30 days)
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    ${recentRevenue.toFixed(2)}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#9ca3af',
                    }}
                  >
                    Paid orders total
                  </span>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 20,
                  border: '1px solid rgba(209,213,219,0.9)',
                  background: '#ffffff',
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
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
                    Current store
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {activeStore.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                    }}
                  >
                    Attach a product, create a link, and every paid order will land here.
                  </span>
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
                    href="/stores"
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
                    Go to store settings
                  </Link>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                  gap: 16,
                  alignItems: 'stretch',
                }}
              >
                <div
                  style={{
                    borderRadius: 20,
                    border: '1px solid rgba(209,213,219,0.9)',
                    background: '#ffffff',
                    padding: 16,
                    display: 'grid',
                    gap: 10,
                    minHeight: 220,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Products
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#6b7280',
                        }}
                      >
                        A quick look at what this store can sell.
                      </span>
                    </div>
                    {hasProducts && (
                      <Link
                        href={`/products?store=${encodeURIComponent(activeStore.id)}`}
                        style={{
                          fontSize: 11,
                          color: '#1d4ed8',
                          textDecoration: 'none',
                        }}
                      >
                        View all products
                      </Link>
                    )}
                  </div>

                  {!hasProducts ? (
                    <div
                      style={{
                        marginTop: 6,
                        borderRadius: 14,
                        border: '1px dashed rgba(209,213,219,0.95)',
                        background: '#f9fafb',
                        padding: 16,
                        fontSize: 12,
                        color: '#6b7280',
                        textAlign: 'center',
                        display: 'grid',
                        gap: 10,
                        justifyItems: 'center',
                      }}
                    >
                      <span>
                        This store has no products yet. Add one to create a checkout link.
                      </span>
                      <Link
                        href={`/products?store=${encodeURIComponent(activeStore.id)}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 14px',
                          borderRadius: 999,
                          border: '1px solid #1d4ed8',
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#f9fafb',
                          textDecoration: 'none',
                          boxShadow: '0 10px 24px rgba(37,99,235,0.25)',
                        }}
                      >
                        Add a product
                      </Link>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: 6,
                        display: 'grid',
                        gap: 6,
                        fontSize: 13,
                      }}
                    >
                      {storeProducts.map((p) => {
                        const inStock = p.inStock === true;
                        const stockLabel = inStock ? 'In stock' : 'Out of stock';
                        const stockColor = inStock ? '#16a34a' : '#b91c1c';

                        return (
                          <div
                            key={p.id}
                            style={{
                              ...itemCardBaseStyle,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                display: 'grid',
                                gap: 2,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  minWidth: 0,
                                }}
                              >
                                <Link
                                  href={`/products/${encodeURIComponent(
                                    p.id,
                                  )}?store=${encodeURIComponent(activeStore.id)}`}
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: '#111827',
                                    textDecoration: 'none',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 220,
                                  }}
                                >
                                  {p.name}
                                </Link>

                                {isNewProduct(p.createdAt) && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      padding: '2px 6px',
                                      borderRadius: 999,
                                      border: '1px solid #bfdbfe',
                                      background: '#eff6ff',
                                      color: '#1d4ed8',
                                      fontWeight: 600,
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    New
                                  </span>
                                )}
                              </div>

                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: stockColor,
                                }}
                              >
                                {stockLabel}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                ${p.price.toFixed(2)}
                              </span>
                              <Link
                                href={`/checkout-links?productId=${encodeURIComponent(
                                  p.id,
                                )}&store=${encodeURIComponent(activeStore.id)}`}
                                style={{
                                  padding: '6px 11px',
                                  borderRadius: 999,
                                  border: '1px solid #1d4ed8',
                                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                  fontSize: 11,
                                  fontWeight: 500,
                                  color: '#f9fafb',
                                  textDecoration: 'none',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 10px 24px rgba(37,99,235,0.3)',
                                }}
                              >
                                Create link
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    borderRadius: 20,
                    border: '1px solid rgba(209,213,219,0.9)',
                    background: '#ffffff',
                    padding: 16,
                    display: 'grid',
                    gap: 10,
                    minHeight: 220,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Latest orders
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#6b7280',
                        }}
                      >
                        A short stream of recent payments for this store.
                      </span>
                    </div>
                    {hasOrders && (
                      <Link
                        href={`/orders?store=${encodeURIComponent(activeStore.id)}`}
                        style={{
                          fontSize: 11,
                          color: '#1d4ed8',
                          textDecoration: 'none',
                        }}
                      >
                        View all orders
                      </Link>
                    )}
                  </div>

                  {!hasOrders ? (
                    <div
                      style={{
                        marginTop: 6,
                        borderRadius: 14,
                        border: '1px dashed rgba(209,213,219,0.95)',
                        background: '#f9fafb',
                        padding: 16,
                        fontSize: 12,
                        color: '#6b7280',
                        textAlign: 'center',
                      }}
                    >
                      No orders yet. Share a checkout link and your first order will appear here.
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: 6,
                        display: 'grid',
                        gap: 6,
                        fontSize: 13,
                      }}
                    >
                      {storeOrders.map((o) => {
                        const createdAtLabel = formatOrderDate(o.createdAt);
                        const quantity = o.quantity ?? 1;

                        return (
                          <Link
                            key={o.id}
                            href={`/orders/${encodeURIComponent(o.id)}?store=${encodeURIComponent(
                              activeStore.id,
                            )}`}
                            style={{
                              textDecoration: 'none',
                              color: 'inherit',
                            }}
                          >
                            <div
                              style={{
                                ...itemCardBaseStyle,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 8,
                                flexWrap: 'wrap',
                              }}
                            >
                              <div
                                style={{
                                  display: 'grid',
                                  gap: 4,
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: 6,
                                    minWidth: 0,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 500,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      maxWidth: 220,
                                    }}
                                  >
                                    {o.product?.name ?? 'Order'}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 600,
                                      color: '#111827',
                                      background: '#e5e7eb',
                                      borderRadius: 999,
                                      border: '1px solid #d1d5db',
                                      padding: '2px 7px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    Qty {quantity}
                                  </span>
                                </div>

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
                                    color: '#9ca3af',
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                    wordBreak: 'break-all',
                                  }}
                                >
                                  {o.id}
                                </span>
                              </div>

                              <div
                                style={{
                                  display: 'grid',
                                  justifyItems: 'flex-end',
                                  textAlign: 'right',
                                  gap: 2,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                  }}
                                >
                                  ${o.total.toFixed(2)}
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
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
