'use client';

import { useRouter } from 'next/navigation';
import type { Product } from '@ts-fullstack-learning/shared';
import Link from 'next/link';

type ProductDTO = Pick<Product, 'id' | 'name' | 'price' | 'inStock'> & {
  storeId?: string | null;
};
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ProductsList({ products }: { products: ProductDTO[] }) {
  const router = useRouter();

  if (products.length === 0) return <p>No products yet.</p>;

  return (
    <ul style={{ display: 'grid', gap: 12, padding: 0, listStyle: 'none', marginTop: 16 }}>
      {products.map((p) => {
        const hasStore = Boolean(p.storeId);
        return (
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
            <Link
              href={`/products/${p.id}`}
              style={{
                color: '#111827',
                fontSize: 15,
                textDecoration: 'underline',
                fontWeight: 600,
              }}
            >
              {p.name} - {usd.format(p.price)} ({p.inStock ? 'in stock' : 'out of stock'})
            </Link>
            <div style={{ display: 'grid', gap: 4, justifyItems: 'end' }}>
              <button
                type="button"
                disabled={!hasStore}
                onClick={() => router.push(`/checkout-links?productId=${p.id}`)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: hasStore ? '#2563eb' : '#e5e7eb',
                  color: hasStore ? '#fff' : '#9ca3af',
                  cursor: hasStore ? 'pointer' : 'not-allowed',
                }}
                title={hasStore ? 'Create checkout link' : 'Attach a store to this product first'}
              >
                Create link
              </button>
              {!hasStore && (
                <small style={{ color: '#6b7280', fontSize: 12 }}>
                  No store linked. Create one on <a href="/stores">/stores</a>.
                </small>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
