'use client';

import { useState, useTransition } from 'react';
import { checkoutAction } from '../actions/checkout';

export function CheckoutForm() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const order = await checkoutAction({
          customerName: form.name,
          email: form.email,
        });
        setMessage(`Order ${order.id} created, total $${order.total.toFixed(2)}`);
        setForm({ name: '', email: '' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>Checkout</h2>

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
        {isPending ? 'Processing…' : 'Checkout'}
      </button>

      {message && <p style={{ color: 'green', margin: 0 }}>{message}</p>}
      {error && <p style={{ color: '#b00', margin: 0 }}>{error}</p>}
    </form>
  );
}
