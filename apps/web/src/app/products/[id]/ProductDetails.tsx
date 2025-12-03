'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ProductByIdQuery } from '../../../graphql/generated/graphql';
import { updateProductAction } from '../../actions/updateProduct';

type ProductData = NonNullable<ProductByIdQuery['product']>;

export function ProductDetails({ product }: { product: ProductData }) {
  const router = useRouter();
  const [price, setPrice] = useState(String(product.price));
  const [inStock, setInStock] = useState(product.inStock);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setMessage(null);
    setError(null);
    const priceNumber = Number(price);
    if (Number.isNaN(priceNumber)) {
      setError('Price must be a number');
      return;
    }
    try {
      await updateProductAction({ id: product.id, price: priceNumber, inStock });
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        maxWidth: 520,
        border: '1px solid #e5e7eb',
        padding: 16,
        borderRadius: 12,
      }}
    >
      <h1 style={{ margin: 0 }}>{product.name}</h1>
      <div style={{ color: '#374151' }}>
        Store:{' '}
        {product.store
          ? `${product.store.name}${product.store.email ? ` (${product.store.email})` : ''}`
          : 'No store'}
      </div>
      <div>
        <Link href={`/checkout-links?productId=${product.id}`}>Create checkout link</Link>
      </div>

      <label>
        Price
        <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
        In stock
      </label>

      <button type="button" onClick={onSave}>
        Save
      </button>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: '#b00' }}>{error}</p>}
    </div>
  );
}
