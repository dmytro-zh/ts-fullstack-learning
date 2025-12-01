'use client';

import { useEffect, useState, FormEvent, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import { addProductAction } from '../actions/addProduct';
import { StoresDocument, type StoresQuery } from '../../graphql/generated/graphql';

export default function AddProductPage() {
  const router = useRouter();
  const [stores, setStores] = useState<StoresQuery['stores']>([]);
  const [formState, setFormState] = useState({ name: '', price: '0', inStock: true, storeId: '' });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const loadStores = async () => {
      try {
        const { GRAPHQL_URL } = getEnv();
        const client = new GraphQLClient(GRAPHQL_URL);
        const data = await client.request<StoresQuery>(StoresDocument);
        setStores(data.stores);
      } catch {
        setStores([]);
      }
    };
    loadStores();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const priceNumber = Number(formState.price);
    if (Number.isNaN(priceNumber)) {
      return setError('Price must be a number');
    }

    startTransition(async () => {
      try {
        await addProductAction({
          name: formState.name,
          price: priceNumber,
          inStock: formState.inStock,
          storeId: formState.storeId || undefined,
        });
        router.push('/');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    });
  };

  return (
    <main style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>Add Product</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 320 }}>
        <label>
          Name
          <input
            value={formState.name}
            onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </label>

        <label>
          Price
          <input
            type="number"
            step="0.01"
            value={formState.price}
            onChange={(e) => setFormState((prev) => ({ ...prev, price: e.target.value }))}
            required
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={formState.inStock}
            onChange={(e) => setFormState((prev) => ({ ...prev, inStock: e.target.checked }))}
          />
          In stock
        </label>

        <label>
          Store
          <select
            value={formState.storeId}
            onChange={(e) => setFormState((prev) => ({ ...prev, storeId: e.target.value }))}
          >
            <option value="">No store</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.email ? `(${s.email})` : ''}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Add product'}
        </button>

        {error && <p style={{ color: '#b00' }}>{error}</p>}
      </form>
    </main>
  );
}
