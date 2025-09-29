// SSR page: fetch products from GraphQL API and render a simple list.
import type { Product } from "@ts-fullstack-learning/shared";
import { ProductsList } from './_components/ProductsList';
const GRAPHQL_URL = process.env.GRAPHQL_URL ?? 'http://localhost:4000/graphql';
const PRODUCTS_QUERY = /* GraphQL */ 'query Products { products { id name price inStock} }';

type ProductDTO = Pick<Product, "id" | "name" | "price" | "inStock">;

// Create a currency formatter once (server-side safe).

async function fetchProducts(): Promise<ProductDTO[]> {
  const res = await fetch(GRAPHQL_URL , {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: PRODUCTS_QUERY,
    }),
    cache: "no-store", // see fresh data each request
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: HTTP ${res.status}`);
  }

  const json: {
    data?: { products?: ProductDTO[] };
    errors?: Array<{ message: string }>;
  } = await res.json();

  if (json.errors?.length) {
    throw new Error(`GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`);
  }

  return json.data?.products ?? [];
}

export default async function Home() {
  const products = await fetchProducts();

  return (
    <main style={{ padding: 24 }}>
      <h1>Products</h1>
      <ProductsList products={products} />
    </main>
  );
}
