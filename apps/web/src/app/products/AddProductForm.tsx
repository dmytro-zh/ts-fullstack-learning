'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addProductAction } from '../actions/addProduct';

type StoreOption = { id: string; name: string; email?: string | null };

export function AddProductForm({ stores }: { stores: StoreOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    price: '0',
    inStock: true,
    storeId: stores[0]?.id ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const priceNumber = Number(form.price);
    if (Number.isNaN(priceNumber)) {
      setSubmitting(false);
      return setError('Price must be a number');
    }
    if (!form.storeId) {
      setSubmitting(false);
      return setError('Store is required');
    }

    try {
      await addProductAction({
        name: form.name,
        price: priceNumber,
        inStock: form.inStock,
        storeId: form.storeId,
      });
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <label>
        Name
        <input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
      </label>

      <label>
        Price
        <input
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
          required
        />
      </label>

      <label>
        Store
        <select
          value={form.storeId}
          onChange={(e) => setForm((p) => ({ ...p, storeId: e.target.value }))}
          required
        >
          <option value="">Select store</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.email ? `(${s.email})` : ''}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={form.inStock}
          onChange={(e) => setForm((prev) => ({ ...prev, inStock: e.target.checked }))}
        />
        In stock
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Add product'}
      </button>

      {error && <p style={{ color: '#b00' }}>{error}</p>}
    </form>
  );
}
