// SSR page: fetch products from GraphQL API and render a simple list.
import { GraphQLClient } from 'graphql-request';
import Link from 'next/link';
import { ProductsList } from './_components/ProductsList';
import { getEnv } from '../lib/env';
import { ProductsDocument, type ProductsQuery } from '../graphql/generated/graphql';

async function fetchData() {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const productsRes = await client.request<ProductsQuery>(ProductsDocument);
  return { products: productsRes.products };
}

export default async function Home() {
  let products: ProductsQuery['products'] = [];

  try {
    ({ products } = await fetchData());
  } catch {
    return (
      <main style={{ padding: 32, background: '#f5f5f6', minHeight: '100vh', color: '#111827' }}>
        Failed to load data.
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 32,
        background: '#f5f5f6',
        minHeight: '100vh',
        width: '100vw',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        }}
      >
        <section
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
            color: '#111827',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Products</h1>
            <Link href="/products" style={{ color: '#2563eb', fontWeight: 600 }}>
              Add product
            </Link>
          </div>
          <ProductsList products={products} />
        </section>
      </div>
    </main>
  );
}
