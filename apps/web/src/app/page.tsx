// SSR page: fetch products from GraphQL API and render a simple list.
import type { Product } from '@ts-fullstack-learning/shared';
import { ProductsList } from './_components/ProductsList';
import { getEnv } from '../lib/env';
import { z } from 'zod';

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products {
    products { id name price inStock }
  }
`;

type ProductDTO = Pick<Product, 'id' | 'name' | 'price' | 'inStock'>;

// --- Zod schemas ---
const GraphQLErrorSchema = z.object({
  message: z.string(),
  path: z.array(z.union([z.string(), z.number()])).optional(),
  extensions: z.record(z.string(), z.any()).optional(),
});

const ProductDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  inStock: z.boolean(),
});

const ProductsResponseSchema = z.object({
  data: z
    .object({
      products: z.array(ProductDtoSchema),
    })
    .optional(),
  errors: z.array(GraphQLErrorSchema).optional(),
});

// --- Data fetch ---
async function fetchProducts(): Promise<ProductDTO[]> {
  const { GRAPHQL_URL } = getEnv();

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: PRODUCTS_QUERY }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: HTTP ${res.status}`);
  }

  const json = await res.json();
  const parsed = ProductsResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Invalid GraphQL shape: ${parsed.error.message}`);
  }
  if (parsed.data.errors?.length) {
    const msgs = parsed.data.errors.map((e) => e.message).join('; ');
    throw new Error(`GraphQL error: ${msgs}`);
  }

  return parsed.data.data?.products ?? [];
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
