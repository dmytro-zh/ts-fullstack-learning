'use client';

import { useState, useTransition } from 'react';
import type { CheckoutLinkQuery } from '../../../graphql/generated/graphql';
import { checkoutByLinkAction, type CheckoutByLinkInput } from '../../actions/checkoutByLink';

type CheckoutLinkData = NonNullable<CheckoutLinkQuery['checkoutLink']>;

type FormState = {
  name: string;
  email: string;
  quantity: string;
  shippingAddress: string;
  shippingNote: string;
};

export function CheckoutLinkView({ link }: { link: CheckoutLinkData }) {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    quantity: '1',
    shippingAddress: '',
    shippingNote: '',
  });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disabled = !link.product.inStock;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const quantityNumber = Number(form.quantity) || 1;

        const payload: CheckoutByLinkInput = {
          slug: link.slug,
          customerName: form.name,
          email: form.email,
          quantity: quantityNumber,
          shippingAddress: form.shippingAddress,
        };

        const trimmedNote = form.shippingNote.trim();
        if (trimmedNote) {
          payload.shippingNote = trimmedNote;
        }

        const order = await checkoutByLinkAction(payload);

        window.location.href = `/thank-you/${order.id}`;
        return;
        setForm({
          name: '',
          email: '',
          quantity: '1',
          shippingAddress: '',
          shippingNote: '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed');
      }
    });
  };

  const p = link.product;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          padding: 14,
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          background: '#f9fafb',
          display: 'grid',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18 }}>{p.name}</div>
        <div style={{ color: '#374151' }}>
          ${p.price.toFixed(2)} {p.inStock ? '(in stock)' : '(out of stock)'}
        </div>
        {link.store && (
          <div style={{ color: '#6b7280' }}>
            Store: {link.store.name} {link.store.email ? `(${link.store.email})` : ''}
          </div>
        )}
        {p.description && <p style={{ margin: 0, color: '#111827' }}>{p.description}</p>}
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            style={{ maxWidth: 260, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
        ) : null}
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
        <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
          <span>Name</span>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
            placeholder="John Doe"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
            placeholder="you@example.com"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
          <span>Quantity</span>
          <input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
            required
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
          <span>Shipping address</span>
          <textarea
            value={form.shippingAddress}
            onChange={(e) => setForm((prev) => ({ ...prev, shippingAddress: e.target.value }))}
            required
            placeholder="Street, city, postal code, country"
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              minHeight: 70,
              resize: 'vertical',
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
          <span>Note (optional)</span>
          <textarea
            value={form.shippingNote}
            onChange={(e) => setForm((prev) => ({ ...prev, shippingNote: e.target.value }))}
            placeholder="Any additional instructions for shipping"
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              minHeight: 60,
              resize: 'vertical',
            }}
          />
        </label>

        <button
          type="submit"
          disabled={isPending || disabled}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #1d4ed8',
            background: disabled ? '#e5e7eb' : isPending ? '#dbeafe' : '#2563eb',
            color: disabled ? '#9ca3af' : '#fff',
            fontWeight: 700,
            cursor: disabled ? 'not-allowed' : isPending ? 'wait' : 'pointer',
          }}
        >
          {disabled ? 'Out of stock' : isPending ? 'Processing…' : 'Buy now'}
        </button>

        {message && <p style={{ color: 'green', margin: 0 }}>{message}</p>}
        {error && <p style={{ color: '#b00', margin: 0 }}>{error}</p>}
      </form>
    </div>
  );
}
