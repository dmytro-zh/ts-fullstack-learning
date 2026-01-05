import Link from 'next/link';
import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import {
  StoresOverviewDocument,
  StoreDashboardDocument,
  type StoresOverviewQuery,
  type StoreDashboardQuery,
} from '../../graphql/generated/graphql';

type SearchParams = Record<string, string | string[] | undefined>;

type ProductsPageProps = {
  searchParams?: Promise<SearchParams>;
};

async function fetchStores(): Promise<StoresOverviewQuery> {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  return client.request<StoresOverviewQuery>(StoresOverviewDocument);
}

async function fetchStoreDashboard(storeId: string): Promise<StoreDashboardQuery> {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  return client.request<StoreDashboardQuery>(StoreDashboardDocument, { storeId });
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams: SearchParams = await (searchParams ?? Promise.resolve<SearchParams>({}));
  const storeParam = resolvedSearchParams['store'];
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
            Products
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
  let storeData: StoreDashboardQuery;

  try {
    const [storesResult, storeResult] = await Promise.all([fetchStores(), fetchStoreDashboard(storeId)]);
    storesData = storesResult;
    storeData = storeResult;
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
          Failed to load products.
        </div>
      </main>
    );
  }

  const stores = storesData.stores ?? [];
  const store = stores.find((s) => s.id === storeId) ?? null;
  const allProducts = storeData.products ?? [];
  const products = allProducts.filter((p) => p.storeId === storeId && p.isActive !== false);

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
              Products
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
              Every product this store can sell, in one place.
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
            <Link
              href={`/products/new?store=${encodeURIComponent(storeId)}`}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: '1px solid #1d4ed8',
                background: 'linear-gradient(135deg, #2563eb 0, #1d4ed8 100%)',
                fontSize: 13,
                fontWeight: 500,
                color: '#f9fafb',
                textDecoration: 'none',
                boxShadow: '0 14px 30px rgba(37,99,235,0.35)',
              }}
            >
              Add product
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
          {products.length === 0 ? (
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
            >
              This store has no products yet. Add one to start creating checkout links.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {products.map((product) => {
                const inStock = product.inStock === true;
                const stockText = inStock ? (product.quantity > 0 ? `${product.quantity} in stock` : 'In stock') : 'Out of stock';
                const stockColor = inStock ? '#16a34a' : '#b91c1c';

                return (
                  <div
                    key={product.id}
                    style={{
                      borderRadius: 14,
                      border: '1px solid rgba(229,231,235,0.95)',
                      background: '#f9fafb',
                      padding: '9px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'grid', gap: 2 }}>
                      <Link
                        href={`/products/${encodeURIComponent(product.id)}?store=${encodeURIComponent(storeId)}`}
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#111827',
                          textDecoration: 'none',
                        }}
                      >
                        {product.name}
                      </Link>
                      <span style={{ fontSize: 11, color: stockColor }}>{stockText}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>${product.price.toFixed(2)}</span>
                      <Link
                        href={`/checkout-links?store=${encodeURIComponent(storeId)}&productId=${encodeURIComponent(product.id)}`}
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
        </section>
      </div>
    </main>
  );
}
