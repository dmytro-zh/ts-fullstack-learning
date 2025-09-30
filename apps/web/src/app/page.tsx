// SSR page: fetch products from GraphQL API and render a simple list.
import { ProductsList } from './_components/ProductsList';
import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../lib/env';
import { ProductsDocument, type ProductsQuery } from '../graphql/generated/graphql';
import Link from 'next/link';


// --- Data fetch ---
async function fetchProducts() {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const data = await client.request<ProductsQuery>(ProductsDocument);
  return data.products;
}

// --- Page (SSR) ---
export default async function Home() {
  const products = await fetchProducts();

  return (
    <main style={{ padding: 24 }}>
      <h1>Products</h1>
      <Link href="/products">Add product</Link>
      <ProductsList products={products} />
    </main>
  );
}
