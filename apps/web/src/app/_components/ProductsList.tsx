'use client';

import { useState, useTransition } from 'react';
import type { Product } from '@ts-fullstack-learning/shared';
import { addCartItemAction } from '../actions/addCartItem';

type ProductDTO = Pick<Product, 'id' | 'name' | 'price' | 'inStock'>;
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ProductsList({ products }: { products: ProductDTO[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (products.length === 0) return <p>No products yet.</p>;

  const handleAdd = (productId: string) => {
    setPendingId(productId);
    startTransition(async () => {
      await addCartItemAction({ productId, quantity: 1 });
      setPendingId(null);
    });
  };

  return (
    <ul style={{ display: 'grid', gap: 12, padding: 0, listStyle: 'none', marginTop: 16 }}>
      {products.map((p) => (
        <li
          key={p.id}
          data-testid="product-item"
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            background: '#fff',
            boxShadow: '0 4px 10px rgba(15, 23, 42, 0.06)',
          }}
        >
          <span style={{ color: '#0f172a', fontSize: 15 }}>
            {p.name} - {usd.format(p.price)} ({p.inStock ? 'in stock' : 'out of stock'})
          </span>
          <button
            onClick={() => handleAdd(p.id)}
            disabled={isPending && pendingId === p.id}
            data-testid="add-to-cart-btn"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #1d4ed8',
              background: isPending && pendingId === p.id ? '#dbeafe' : '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: isPending && pendingId === p.id ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending && pendingId === p.id ? 'Adding…' : 'Add to cart'}
          </button>
        </li>
      ))}
    </ul>
  );
}
