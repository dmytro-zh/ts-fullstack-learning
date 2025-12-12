import Link from 'next/link';
import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../../lib/env';
import {
  ProductByIdDocument,
  type ProductByIdQuery,
} from '../../../graphql/generated/graphql';
import { ProductDetails } from './ProductDetails';

type SearchParams = Record<string, string | string[] | undefined>;

type ProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<SearchParams>;
};

async function fetchProduct(id: string): Promise<ProductByIdQuery> {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  return client.request<ProductByIdQuery>(ProductByIdDocument, { id });
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const storeParam = resolvedSearchParams.store;
  const storeIdFromQuery = typeof storeParam === 'string' ? storeParam : undefined;

  let data: ProductByIdQuery;

  try {
    data = await fetchProduct(id);
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
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>Failed to load product.</div>
      </main>
    );
  }

  const product = data.product;

  if (!product) {
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
            gap: 12,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, letterSpacing: -0.03 }}>Product not found</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#4b5563' }}>
            It might have been removed or does not belong here.
          </p>

          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {storeIdFromQuery && (
              <Link
                href={`/products?store=${encodeURIComponent(storeIdFromQuery)}`}
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
            )}
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
        </div>
      </main>
    );
  }

  const storeId = product.store?.id ?? storeIdFromQuery;

  return (
    <main
      style={{
        padding: '32px 16px 40px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        color: '#020617',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 18 }}>
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
            <div style={{ fontSize: 12, color: '#6b7280' }}>Product</div>
            <h1 style={{ margin: 0, fontSize: 24, letterSpacing: -0.03 }}>{product.name}</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              {product.store ? product.store.name : 'Store'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {storeId && (
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
            )}
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

        <ProductDetails product={product} />
      </div>
    </main>
  );
}
