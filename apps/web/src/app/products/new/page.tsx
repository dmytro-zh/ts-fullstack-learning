import Link from 'next/link';
import { createWebGraphQLClient } from '../../../lib/graphql-client';
import {
  StoresOverviewDocument,
  type StoresOverviewQuery,
} from '../../../graphql/generated/graphql';
import { AddProductForm } from '../AddProductForm';

type SearchParams = Record<string, string | string[] | undefined>;

type NewProductPageProps = {
  searchParams?: Promise<SearchParams>;
};

async function fetchStores(): Promise<StoresOverviewQuery> {
  const client = await createWebGraphQLClient();
  return client.request<StoresOverviewQuery>(StoresOverviewDocument);
}

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const resolvedSearchParams: SearchParams = await (searchParams ??
    Promise.resolve<SearchParams>({}));

  const storeParam = resolvedSearchParams['store'];
  const storeId = typeof storeParam === 'string' ? storeParam : undefined;

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
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          Failed to load stores for product creation.
        </div>
      </main>
    );
  }

  const stores = storesData.stores ?? [];

  const orderedStores =
    storeId && stores.length > 0
      ? [...stores].sort((a, b) => {
          if (a.id === storeId) return -1;
          if (b.id === storeId) return 1;
          return 0;
        })
      : stores;

  return (
    <main
      style={{
        padding: '32px 16px 40px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        color: '#020617',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 20 }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>New product</div>
            <h1 style={{ margin: 0, fontSize: 24, letterSpacing: -0.03 }}>
              Add a product to this tiny store.
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              Give it a clear name and price. It will be ready for checkout links right away.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {storeId ? (
              <Link
                href={`/products?store=${encodeURIComponent(storeId)}`}
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
                Back to products
              </Link>
            ) : null}

            <Link
              href="/dashboard"
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
            padding: 24,
            boxShadow: '0 18px 40px rgba(15,23,42,0.06)',
          }}
        >
          <AddProductForm stores={orderedStores} />
        </section>
      </div>
    </main>
  );
}
