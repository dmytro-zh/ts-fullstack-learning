import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import {
  StoresDocument,
  type StoresQuery,
  CreateStoreDocument,
  type CreateStoreMutationVariables,
} from '../../graphql/generated/graphql';

async function fetchStores() {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const res = await client.request<StoresQuery>(StoresDocument);
  return res.stores;
}

async function createStore(input: CreateStoreMutationVariables['input']) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  await client.request(CreateStoreDocument, { input });
}

export default async function StoresPage() {
  const stores = await fetchStores();

  return (
    <main
      style={{
        background: '#f5f5f6',
        minHeight: '100vh',
        width: '100vw',
        padding: '48px 0',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: 'min(780px, 100% - 32px)',
          margin: '0 auto',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
          display: 'grid',
          gap: 18,
          color: '#0f172a',
          fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", sans-serif',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Create store</h1>

        <form
          action={async (formData: FormData) => {
            'use server';
            const name = String(formData.get('name') ?? '');
            const email = String(formData.get('email') ?? '');
            await createStore({ name, email: email || undefined });
          }}
          style={{ display: 'grid', gap: 12 }}
        >
          <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
            Name
            <input
              name="name"
              required
              placeholder="For example: Cozy Scarves Studio"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                color: '#0f172a',
                caretColor: '#2563eb',
                fontSize: 14,
                lineHeight: 1.4,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
            Email (optional)
            <input
              name="email"
              type="email"
              placeholder="owner@example.com"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                color: '#0f172a',
                caretColor: '#2563eb',
                fontSize: 14,
                lineHeight: 1.4,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              marginTop: 4,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #1d4ed8',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Create store
          </button>
        </form>

        <div style={{ display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Existing stores</h2>
          {stores.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280' }}>No stores yet.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
              {stores.map((s) => (
                <li key={s.id} style={{ color: '#111827' }}>
                  {s.name} {s.email ? `(${s.email})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}