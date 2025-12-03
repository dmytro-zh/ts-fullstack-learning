import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import { StoresDocument, type StoresQuery } from '../../graphql/generated/graphql';
import { AddProductForm } from './AddProductForm';

async function fetchStores() {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const res = await client.request<StoresQuery>(StoresDocument);
  return res.stores;
}

export default async function AddProductPage() {
  const stores = await fetchStores();
  return (
    <main style={{ padding: 24 }}>
      <h1>Add Product</h1>
      <AddProductForm stores={stores} />
    </main>
  );
}
