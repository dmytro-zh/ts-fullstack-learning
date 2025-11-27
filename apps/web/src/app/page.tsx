// SSR page: fetch products and cart items from GraphQL API and render lists.
import { GraphQLClient } from 'graphql-request';
import Link from 'next/link';
import { ProductsList } from './_components/ProductsList';
import { CheckoutForm } from './_components/CheckoutForm';
import { CartList } from './_components/CartList';
import { getEnv } from '../lib/env';
import {
  ProductsDocument,
  type ProductsQuery,
  CartItemsDocument,
  type CartItemsQuery,
} from '../graphql/generated/graphql';

// --- Data fetch ---
async function fetchData() {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);

  const [productsRes, cartRes] = await Promise.all([
    client.request<ProductsQuery>(ProductsDocument),
    client.request<CartItemsQuery>(CartItemsDocument),
  ]);

  return { products: productsRes.products, cartItems: cartRes.cartItems };
}

// --- Page (SSR) ---
export default async function Home() {
  let products: ProductsQuery['products'] = [];
  let cartItems: CartItemsQuery['cartItems'] = [];

  try {
    ({ products, cartItems } = await fetchData());
  } catch {
    return (
      <main style={{ padding: 32, background: '#f7f7f8', minHeight: '100vh', color: '#111827' }}>
        Failed to load data.
      </main>
    );
  }

  return (
    <main style={{ padding: 32, background: '#f7f7f8', minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
              marginBottom: 8,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Products</h1>
            <Link href="/products" style={{ color: '#2563eb', fontWeight: 600 }}>
              Add product
            </Link>
          </div>
          <ProductsList products={products} />
        </section>

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
          <CartList items={cartItems} />
        </section>

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
          <CheckoutForm />
        </section>
      </div>
    </main>
  );
}
