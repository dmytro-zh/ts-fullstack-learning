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
      <section>
        <h2>Cart</h2>
        <p>Cart is empty.</p>
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
    <section>
      <h2>Cart</h2>
      <ul style={{ display: 'grid', gap: 8 }}>
        {items.map((item) => (
          <li key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>
              {item.product.name} × {item.quantity} = {usd.format(item.quantity * item.product.price)}
            </span>
            <button
              onClick={() => handleRemove(item.id)}
              disabled={isPending && pendingId === item.id}
            >
              {isPending && pendingId === item.id ? 'Removing…' : 'Remove'}
            </button>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 12 }}>Total: {usd.format(total)}</p>
    </section>
  );
}
