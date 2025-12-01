import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import { StoresDocument, type StoresQuery } from '../../graphql/generated/graphql';
import { StoreForm } from './StoreForm';

async function fetchStores() {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  return client.request<StoresQuery>(StoresDocument);
}

export default async function StoresPage() {
  let stores: StoresQuery['stores'] = [];
  try {
    const data = await fetchStores();
    stores = data.stores;
  } catch {
    return <main style={{ padding: 24 }}>Failed to load stores.</main>;
  }

  return (
    <main style={{ padding: 32 }}>
      <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <StoreForm />
        <ul>
          {stores.map((s) => (
            <li key={s.id}>{s.name} {s.email ? `(${s.email})` : ''}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
