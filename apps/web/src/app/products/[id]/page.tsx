import Link from 'next/link';
import { createWebGraphQLClient } from '../../../lib/graphql-client';
import { headers, cookies } from 'next/headers';
import { print, type DocumentNode } from 'graphql';
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

function getServerBaseUrl(h: Headers) {
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

async function _gqlRequest<TData>(args: { query: DocumentNode; variables?: Record<string, unknown> }) {
  const h = await headers();
  const baseUrl = getServerBaseUrl(h);

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${baseUrl}/api/graphql`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({
      query: print(args.query),
      variables: args.variables ?? {},
    }),
  });

  const json = (await res.json()) as { data?: TData; errors?: unknown };

  if (!res.ok || json.errors) {
    throw new Error(`GraphQL request failed: ${res.status}${json.errors ? ' (graphql errors)' : ''}`);
  }

  return json.data as TData;
}

void _gqlRequest;

async function fetchProduct(id: string): Promise<ProductByIdQuery> {
  const client = await createWebGraphQLClient();
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
      <main style={{ padding: '32px 16px 40px', minHeight: '100vh', boxSizing: 'border-box', color: '#020617' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>Failed to load product.</div>
      </main>
    );
  }

  const product = data.product;

  if (!product) {
    return (
      <main style={{ padding: '32px 16px 40px', minHeight: '100vh', boxSizing: 'border-box', color: '#020617' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 12 }}>
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

  const pageBgStyle: React.CSSProperties = {
    padding: '32px 16px 40px',
    minHeight: '100vh',
    boxSizing: 'border-box',
    color: '#0f172a',
    background:
      'radial-gradient(1200px 600px at 50% -10%, rgba(37,99,235,0.12), rgba(255,255,255,0) 55%), linear-gradient(180deg, #f8fafc 0%, #ffffff 55%)',
  };

  const buttonLink: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid rgba(226,232,240,0.95)',
    background: '#ffffff',
    color: '#0f172a',
    fontWeight: 900,
    textDecoration: 'none',
    boxShadow: '0 8px 22px rgba(15,23,42,0.06)',
    lineHeight: '20px',
    whiteSpace: 'nowrap',
    fontSize: 13,
  };

  return (
    <main style={pageBgStyle}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 18 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>Product</div>
            <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.02em' }}>{product.name}</h1>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 800 }}>
              {product.store ? product.store.name : 'Store'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {storeId && (
              <Link href={`/products?store=${encodeURIComponent(storeId)}`} style={buttonLink}>
                Back to products
              </Link>
            )}
            <Link href="/dashboard" style={buttonLink}>Back to dashboard</Link>
          </div>
        </header>

        <ProductDetails product={product} storeId={storeId ?? null} />
      </div>
    </main>
  );
}
