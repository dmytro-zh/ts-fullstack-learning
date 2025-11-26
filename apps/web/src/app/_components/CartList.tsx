'use client';

import { useState, useTransition } from 'react';
import { removeCartItemAction } from '../actions/removeCartItem';

type CartItemDTO = {
  id: string;
  quantity: number;
  product: { id: string; name: string; price: number };
};

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function CartList({ items }: { items: CartItemDTO[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const total = items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  if (items.length === 0) {
    return (
      <section data-testid="cart-empty">
        <h2 style={{ margin: 0, fontSize: 20, color: '#111827' }}>Cart</h2>
        <p style={{ color: '#6b7280', marginTop: 8 }}>Cart is empty.</p>
      </section>
    );
  }

  const handleRemove = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      await removeCartItemAction({ id });
      setPendingId(null);
    });
  };

  return (
    <section data-testid="cart-section">
      <h2 style={{ margin: 0, fontSize: 20, color: '#111827' }}>Cart</h2>
      <ul style={{ display: 'grid', gap: 12, padding: 0, listStyle: 'none', marginTop: 12 }}>
        {items.map((item) => (
          <li
            key={item.id}
            data-testid="cart-item"
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: '#fff',
              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.06)',
            }}
          >
            <span style={{ color: '#0f172a' }}>
              {item.product.name} × {item.quantity} ={' '}
              {usd.format(item.quantity * item.product.price)}
            </span>
            <button
              onClick={() => handleRemove(item.id)}
              disabled={isPending && pendingId === item.id}
              data-testid="remove-from-cart-btn"
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #b91c1c',
                background: isPending && pendingId === item.id ? '#fecdd3' : '#dc2626',
                color: '#fff',
                fontWeight: 600,
                cursor: isPending && pendingId === item.id ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending && pendingId === item.id ? 'Removing…' : 'Remove'}
            </button>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 12, fontWeight: 600, color: '#111827' }}>Total: {usd.format(total)}</p>
    </section>
  );
}
