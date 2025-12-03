import { notFound } from 'next/navigation';
import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../../lib/env';
import {
  ProductByIdDocument,
  type ProductByIdQuery,
} from '../../../graphql/generated/graphql';
import { ProductDetails } from './ProductDetails';

async function fetchProduct(id: string) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const data = await client.request<ProductByIdQuery>(ProductByIdDocument, { id });
  return data.product ?? null;
}

type PageProps = { params: { id: string } };

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;        // дождались params
  const product = await fetchProduct(id);
  if (!product) return notFound();

  return (
    <main style={{ padding: 24 }}>
      <ProductDetails product={product} />
    </main>
  );
}
