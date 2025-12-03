// SSR: fetch products+stores for selects
import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import {
  ProductsDocument,
  type ProductsQuery,
  StoresDocument,
  type StoresQuery,
} from '../../graphql/generated/graphql';
import { CheckoutLinksForm } from './CheckoutLinksForm';

async function fetchData() {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const [productsRes, storesRes] = await Promise.all([
    client.request<ProductsQuery>(ProductsDocument),
    client.request<StoresQuery>(StoresDocument),
  ]);
  return { products: productsRes.products, stores: storesRes.stores };
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutLinksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialProductId =
    typeof params?.productId === 'string' ? params.productId : undefined;

  try {
    const { products, stores } = await fetchData();
    return (
      <main style={{ padding: 32, background: '#f7f7f8', minHeight: '100vh' }}>
        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            display: 'grid',
            gap: 16,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
            color: '#111827',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Checkout links</h1>
          <CheckoutLinksForm
            products={products}
            stores={stores}
            initialProductId={initialProductId}
          />
        </div>
      </main>
    );
  } catch {
    return (
      <main style={{ padding: 32, background: '#f7f7f8', minHeight: '100vh', color: '#111827' }}>
        Failed to load data.
      </main>
    );
  }
}
