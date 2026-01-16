'use client';

import { useRouter } from 'next/navigation';
import type { Product } from '@ts-fullstack-learning/shared';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { Text } from '../../components/ui/Text';
import styles from './ProductsList.module.css';

type ProductDTO = Pick<Product, 'id' | 'name' | 'price' | 'inStock'> & {
  storeId?: string | null;
};
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ProductsList({ products }: { products: ProductDTO[] }) {
  const router = useRouter();

  if (products.length === 0) {
    return (
      <Text as="p" variant="muted">
        No products yet.
      </Text>
    );
  }

  return (
    <ul className={styles.list}>
      {products.map((p) => {
        const hasStore = Boolean(p.storeId);
        return (
          <li key={p.id} data-testid="product-item" className={styles.item}>
            <Link href={`/products/${p.id}`} className={styles.link}>
              {p.name} - {usd.format(p.price)} ({p.inStock ? 'in stock' : 'out of stock'})
            </Link>
            <div className={styles.actions}>
              <Button
                type="button"
                disabled={!hasStore}
                onClick={() => router.push(`/checkout-links?productId=${p.id}`)}
                title={hasStore ? 'Create checkout link' : 'Attach a store to this product first'}
                size="sm"
                shape="rounded"
                variant="secondary"
              >
                Create link
              </Button>
              {!hasStore && (
                <small className={styles.helper}>
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
