'use client';

import { useState, useTransition } from 'react';
import type { Store } from '../../graphql/generated/graphql';
import { addProductAction } from '../actions/addProduct';

type StoreOption = Pick<Store, 'id' | 'name' | 'email'>;

export function AddProductForm({ stores }: { stores: StoreOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    price: '0',
    inStock: true,
    storeId: stores[0]?.id ?? '',
    description: '',
    imageUrl: '',
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // поддерживаем и "10.5", и "10,5"
    const priceNumber = Number(form.price.replace(',', '.'));

    if (Number.isNaN(priceNumber)) {
      return setError('Price must be a number');
    }
    if (!form.storeId) {
      return setError('Store is required');
    }

    startTransition(async () => {
      try {
        await addProductAction({
          name: form.name,
          price: priceNumber,
          inStock: form.inStock,
          storeId: form.storeId,
          description: form.description || undefined,
          imageUrl: form.imageUrl || undefined,
        });
        setForm((p) => ({
          ...p,
          name: '',
          price: '0',
          description: '',
          imageUrl: '',
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Name</span>
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
          placeholder="Blue hoodie"
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
          }}
        />
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        <span>Price</span>
        <input
          type="text"
          inputMode="decimal"
          value={form.price}
          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          required
          placeholder="49.99"
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
          }}
        />
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        <span>Store (required)</span>
        <select
          value={form.storeId}
          onChange={(e) => setForm((p) => ({ ...p, storeId: e.target.value }))}
          required
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
          }}
        >
          <option value="">Select store</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.email ? `(${s.email})` : ''}
            </option>
          ))}
        </select>
        {stores.length === 0 && (
          <small style={{ color: '#b00' }}>Create a store first at /stores</small>
        )}
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        <span>Description (optional)</span>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={4}
          placeholder="Soft cotton hoodie with embroidered logo."
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
          }}
        />
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        <span>Image URL (optional)</span>
        <input
          value={form.imageUrl}
          onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
          placeholder="https://example.com/image.jpg"
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
          }}
        />
      </label>

      {form.imageUrl && (
        <img
          src={form.imageUrl}
          alt="preview"
          style={{
            maxWidth: 220,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}
        />
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={form.inStock}
          onChange={(e) => setForm((p) => ({ ...p, inStock: e.target.checked }))}
        />
        In stock
      </label>

      <button
        type="submit"
        disabled={isPending || !form.storeId}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #1d4ed8',
          background: !form.storeId ? '#e5e7eb' : isPending ? '#dbeafe' : '#2563eb',
          color: !form.storeId ? '#9ca3af' : '#fff',
          fontWeight: 700,
          cursor: !form.storeId ? 'not-allowed' : isPending ? 'wait' : 'pointer',
        }}
      >
        {isPending ? 'Saving…' : 'Add product'}
      </button>

      {error && <p style={{ color: '#b00', margin: 0 }}>{error}</p>}
    </form>
  );
}