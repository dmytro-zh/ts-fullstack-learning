'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import type { Store } from '../../graphql/generated/graphql';
import { addProductAction } from '../actions/addProduct';

type StoreOption = Pick<Store, 'id' | 'name' | 'email'>;

export function AddProductForm({ stores }: { stores: StoreOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    price: '0',
    storeId: stores[0]?.id ?? '',
    description: '',
    imageUrl: '',
    quantity: '0',
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const priceNumber = Number(form.price);
    if (Number.isNaN(priceNumber)) {
      setError('Price must be a number');
      return;
    }

    const quantityNumber = Number(form.quantity);
    if (Number.isNaN(quantityNumber) || !Number.isInteger(quantityNumber) || quantityNumber < 0) {
      setError('Quantity must be a non-negative integer');
      return;
    }

    if (!form.storeId) {
      setError('Store is required');
      return;
    }

    startTransition(async () => {
      try {
        await addProductAction({
          name: form.name,
          price: priceNumber,
          storeId: form.storeId,
          description: form.description || undefined,
          imageUrl: form.imageUrl || undefined,
          quantity: quantityNumber,
        });

        setForm((p) => ({
          ...p,
          name: '',
          price: '0',
          description: '',
          imageUrl: '',
          quantity: '0',
        }));

        setMessage(
          'Product has been created. You can now use it on the home page and in checkout links.',
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save product');
      }
    });
  };

  const fieldBase: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#0f172a',
    caretColor: '#2563eb',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 14,
  };

  const labelBase: React.CSSProperties = {
    display: 'grid',
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: 'grid',
        gap: 16,
        width: '100%',
      }}
    >
      {error && (
        <p
          style={{
            margin: 0,
            padding: '8px 10px',
            borderRadius: 8,
            background: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            fontSize: 13,
          }}
        >
          {error}
        </p>
      )}

      {message && (
        <p
          style={{
            margin: 0,
            padding: '8px 10px',
            borderRadius: 8,
            background: '#ecfdf3',
            color: '#166534',
            border: '1px solid #bbf7d0',
            fontSize: 13,
          }}
        >
          {message}
        </p>
      )}

      <label style={labelBase}>
        <span>Name</span>
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
          placeholder="Blue hoodie"
          style={fieldBase}
        />
      </label>

      <label style={labelBase}>
        <span>Price</span>
        <input
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          required
          style={fieldBase}
        />
      </label>

      <label style={labelBase}>
        <span>Quantity</span>
        <input
          type="number"
          min={0}
          step={1}
          value={form.quantity}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              setForm((p) => ({ ...p, quantity: '' }));
              return;
            }
            const numeric = Number(value);
            if (!Number.isNaN(numeric) && numeric >= 0) {
              setForm((p) => ({ ...p, quantity: String(Math.floor(numeric)) }));
            }
          }}
          style={fieldBase}
        />
      </label>

      <label style={labelBase}>
        <span>Store (required)</span>
        <select
          value={form.storeId}
          onChange={(e) => setForm((p) => ({ ...p, storeId: e.target.value }))}
          required
          style={fieldBase}
        >
          <option value="">Select store</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.email ? `(${s.email})` : ''}
            </option>
          ))}
        </select>
        {stores.length === 0 && (
          <small style={{ color: '#b00', fontSize: 12 }}>Create a store first at /stores.</small>
        )}
      </label>

      <label style={labelBase}>
        <span>Description (optional)</span>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={4}
          placeholder="Soft cotton hoodie with embroidered logo."
          style={{
            ...fieldBase,
            resize: 'vertical',
          }}
        />
      </label>

      <label style={labelBase}>
        <span>Image URL (optional)</span>
        <input
          value={form.imageUrl}
          onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
          placeholder="https://example.com/image.jpg"
          style={fieldBase}
        />
      </label>

      {form.imageUrl && (
        <div
          style={{
            maxWidth: '100%',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          <Image
            src={form.imageUrl}
            alt="preview"
            width={400}
            height={400}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !form.storeId}
        style={{
          padding: '12px 16px',
          borderRadius: 999,
          border: '1px solid #1d4ed8',
          background: !form.storeId ? '#e5e7eb' : isPending ? '#dbeafe' : '#2563eb',
          color: !form.storeId ? '#9ca3af' : '#ffffff',
          fontWeight: 700,
          cursor: !form.storeId ? 'not-allowed' : isPending ? 'wait' : 'pointer',
          fontSize: 14,
          marginTop: 4,
        }}
      >
        {isPending ? 'Saving…' : 'Add product'}
      </button>
    </form>
  );
}
