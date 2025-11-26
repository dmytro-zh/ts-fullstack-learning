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
    <ul style={{ display: 'grid', gap: 8 }}>
      {products.map((p) => (
        <li key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>
            {p.name} - {usd.format(p.price)} ({p.inStock ? 'in stock' : 'out of stock'})
          </span>
          <button
            onClick={() => handleAdd(p.id)}
            disabled={isPending && pendingId === p.id}
          >
            {isPending && pendingId === p.id ? 'Adding…' : 'Add to cart'}
          </button>
        </li>
      ))}
    </ul>
  );
}
