'use client';

import type { Product } from '@ts-fullstack-learning/shared';

type ProductDTO = Pick<Product, 'id' | 'name' | 'price' | 'inStock'>;
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ProductsList({ products }: { products: ProductDTO[] }) {
  if (products.length === 0) return <p>No products yet.</p>;

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
          <span style={{ color: '#6b7280', fontSize: 13 }}>Sell via checkout links</span>
        </li>
      ))}
    </ul>
  );
}
