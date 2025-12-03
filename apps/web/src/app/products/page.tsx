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
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Add product</h1>
        <AddProductForm stores={stores} />
      </div>
    </main>
  );
}
