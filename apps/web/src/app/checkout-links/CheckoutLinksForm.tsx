'use client';

import { useState, useTransition } from 'react';
import type { ProductsQuery, StoresQuery } from '../../graphql/generated/graphql';
import { createCheckoutLinkAction } from '../actions/createCheckoutLink';

type Props = {
  products: ProductsQuery['products'];
  stores: StoresQuery['stores'];
};

export function CheckoutLinksForm({ products, stores }: Props) {
  const [form, setForm] = useState<{ slug: string; productId: string; storeId: string }>({
    slug: '',
    productId: products[0]?.id ?? '',
    storeId: stores[0]?.id ?? '',
  });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const link = await createCheckoutLinkAction({
          slug: form.slug,
          productId: form.productId,
          storeId: form.storeId || undefined,
        });
        setMessage(`Link created: slug=${link.slug}, product=${link.product.name}${link.store ? `, store=${link.store.name}` : ''}`);
        setForm((p) => ({ ...p, slug: '' }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create link');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
        <span style={{ color: '#111827' }}>Slug</span>
        <input
          value={form.slug}
          onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
          required
          placeholder="my-product-link"
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#0f172a',
          }}
        />
      </label>

      <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
        <span style={{ color: '#111827' }}>Product</span>
        <select
          value={form.productId}
          onChange={(e) => setForm((p) => ({ ...p, productId: e.target.value }))}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#0f172a',
          }}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (${p.price.toFixed(2)})
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
        <span style={{ color: '#111827' }}>Store (optional)</span>
        <select
          value={form.storeId}
          onChange={(e) => setForm((p) => ({ ...p, storeId: e.target.value }))}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#0f172a',
          }}
        >
          <option value="">No store</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.email ? `(${s.email})` : ''}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #1d4ed8',
          background: isPending ? '#dbeafe' : '#2563eb',
          color: '#fff',
          fontWeight: 700,
          cursor: isPending ? 'not-allowed' : 'pointer',
        }}
      >
        {isPending ? 'Creating…' : 'Create checkout link'}
      </button>

      {message && <p style={{ color: 'green', margin: 0 }}>{message}</p>}
      {error && <p style={{ color: '#b00', margin: 0 }}>{error}</p>}
    </form>
  );
}
