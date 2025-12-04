import { GraphQLClient } from 'graphql-request';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getEnv } from '../../lib/env';
import {
  StoresDocument,
  type StoresQuery,
} from '../../graphql/generated/graphql';
import { createStoreAction as createStoreMutation } from '../actions/createStore';

async function fetchStores() {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const res = await client.request<StoresQuery>(StoresDocument);
  return res.stores;
}

async function createStoreAction(formData: FormData) {
  'use server';

  const rawName = String(formData.get('name') ?? '');
  const rawEmail = String(formData.get('email') ?? '');

  const name = rawName.trim();
  const email = rawEmail.trim();

  if (!name) {
    redirect('/stores?error=1');
  }

  try {
    await createStoreMutation({ name, email: email || undefined });
  } catch (err) {
    console.error('Failed to create store', err);
    redirect('/stores?error=1');
  }

  redirect('/stores?created=1');
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const wasCreated = params.created === '1';
  const hasError = !wasCreated && params.error === '1';

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

        {wasCreated && (
          <p
            style={{
              margin: 0,
              padding: '8px 10px',
              borderRadius: 8,
              background: '#ecfdf3',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              fontSize: 13,
            }}
          >
            Store has been created. You can now attach products to this store and receive orders.
          </p>
        )}

        {hasError && (
          <p
            style={{
              margin: 0,
              padding: '8px 10px',
              borderRadius: 8,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: 13,
            }}
          >
            Failed to create store. Please try again.
          </p>
        )}

        <form action={createStoreAction} style={{ display: 'grid', gap: 12 }}>
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
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                display: 'grid',
                gap: 6,
              }}
            >
              {stores.map((s) => (
                <li key={s.id} style={{ color: '#111827' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span>
                      {s.name}
                      {s.email ? ` (${s.email})` : ''}
                    </span>

                    <Link
                      href={`/orders?storeId=${s.id}`}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        border: '1px solid #2563eb',
                        background: '#2563eb',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                      }}
                    >
                      View orders
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
