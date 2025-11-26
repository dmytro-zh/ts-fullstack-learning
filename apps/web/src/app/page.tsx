// SSR page: fetch products and cart items from GraphQL API and render lists.
import { GraphQLClient } from 'graphql-request';
import Link from 'next/link';
import { ProductsList } from './_components/ProductsList';
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
  const { products, cartItems } = await fetchData();

  return (
    <main style={{ padding: 24, display: 'grid', gap: 24 }}>
      <section>
        <h1>Products</h1>
        <Link href="/products">Add product</Link>
        <ProductsList products={products} />
      </section>

      <CartList items={cartItems} />
    </main>
  );
}
