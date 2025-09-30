// SSR page: fetch products from GraphQL API and render a simple list.
import { ProductsList } from './_components/ProductsList';
import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../lib/env';
import { getSdk } from '../graphql/generated';

// --- Data fetch ---
async function fetchProducts() {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const sdk = getSdk(client);

  const { products } = await sdk.Products();
  return products;
}

// --- Page (SSR) ---
export default async function Home() {
  const products = await fetchProducts();

  return (
    <main style={{ padding: 24 }}>
      <h1>Products</h1>
      <ProductsList products={products} />
    </main>
  );
}
