'use client';

import { useState, useTransition } from 'react';
import type { CheckoutLinkQuery } from '../../../graphql/generated/graphql';
import { checkoutByLinkAction } from '../../actions/checkoutByLink';

type CheckoutLinkData = NonNullable<CheckoutLinkQuery['checkoutLink']>;

export function CheckoutLinkView({ link }: { link: CheckoutLinkData }) {
  const [form, setForm] = useState({ name: '', email: '', quantity: 1, shippingNote: '' });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const order = await checkoutByLinkAction({
          slug: link.slug,
          customerName: form.name,
          email: form.email,
          shippingNote: form.shippingNote || undefined,
          quantity: form.quantity || 1,
        });
        setMessage(`Order ${order.id} created, total $${order.total.toFixed(2)}`);
        setForm({ name: '', email: '', quantity: 1, shippingNote: '' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed');
      }
    });
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
        <p style={{ margin: 0, fontWeight: 700 }}>{link.product.name}</p>
        <p style={{ margin: '4px 0', color: '#374151' }}>
          ${link.product.price.toFixed(2)} {link.product.inStock ? '(in stock)' : '(out of stock)'}
        </p>
        {link.store ? (
          <p style={{ margin: '4px 0', color: '#6b7280' }}>
            Store: {link.store.name} {link.store.email ? `(${link.store.email})` : ''}
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
        <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
          <span style={{ color: '#111827' }}>Name</span>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            placeholder="John Doe"
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
          <span style={{ color: '#111827' }}>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
            placeholder="you@example.com"
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
          <span style={{ color: '#111827' }}>Quantity</span>
          <input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) =>
              setForm((p) => ({ ...p, quantity: Math.max(1, Number(e.target.value) || 1) }))
            }
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
          <span style={{ color: '#111827' }}>Shipping / notes</span>
          <textarea
            value={form.shippingNote}
            onChange={(e) => setForm((p) => ({ ...p, shippingNote: e.target.value }))}
            placeholder="Address or pickup instructions"
            rows={3}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#0f172a',
            }}
          />
        </label>

        <button
          type="submit"
          disabled={isPending || !link.product.inStock}
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
          {isPending ? 'Processing…' : 'Buy now'}
        </button>

        {message && <p style={{ color: 'green', margin: 0 }}>{message}</p>}
        {error && <p style={{ color: '#b00', margin: 0 }}>{error}</p>}
      </form>
    </div>
  );
}
