'use client';

import { useMemo, useState, useTransition } from 'react';
import type { Product, Store } from '../../graphql/generated/graphql';
import { createCheckoutLinkAction } from '../actions/createCheckoutLink';

type ProductOption = Pick<Product, 'id' | 'name' | 'price' | 'storeId'>;
type StoreOption = Pick<Store, 'id' | 'name' | 'email'>;
type Props = {
  products: ProductOption[];
  stores: StoreOption[];
  initialProductId?: string | undefined;
};

function slugify(storeName: string, productName: string) {
  return `${storeName}-${productName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function CheckoutLinksForm({ products, stores, initialProductId }: Props) {
  const defaultProduct = useMemo(
    () => products.find((p) => p.id === initialProductId) ?? products[0],
    [products, initialProductId],
  );
  const defaultStore = useMemo(
    () => stores.find((s) => s.id === defaultProduct?.storeId) ?? stores[0],
    [stores, defaultProduct],
  );

  const [form, setForm] = useState({
    slug: defaultProduct && defaultStore ? slugify(defaultStore.name, defaultProduct.name) : '',
    productId: defaultProduct?.id ?? '',
    storeId: defaultStore?.id ?? '',
  });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLinkUrl(null);

    startTransition(async () => {
      try {
        const link = await createCheckoutLinkAction({
          slug: form.slug,
          productId: form.productId,
          storeId: form.storeId || undefined,
        });
        const url = `${window.location.origin}/c/${link.slug}`;
        setLinkUrl(url);
        setMessage(`Link created: ${url}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create link');
      }
    });
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    const store = stores.find((s) => s.id === product?.storeId) ?? null;
    setForm((p) => ({
      ...p,
      productId,
      storeId: store?.id ?? '',
      slug: product && store ? slugify(store.name, product.name) : p.slug,
    }));
  };

  const copyLink = () => {
    if (linkUrl) {
      void navigator.clipboard.writeText(linkUrl);
      setMessage(`Link copied: ${linkUrl}`);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
        <span style={{ color: '#111827' }}>Slug</span>
        <input
          value={form.slug}
          onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
          required
          placeholder="my-store-product"
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
        <span style={{ color: '#111827' }}>Product</span>
        <select
          value={form.productId}
          onChange={(e) => handleProductChange(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#0f172a',
          }}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (${p.price.toFixed(2)})
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
        <span style={{ color: '#111827' }}>Store (optional)</span>
        <select
          value={form.storeId}
          onChange={(e) => setForm((p) => ({ ...p, storeId: e.target.value }))}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#0f172a',
          }}
        >
          <option value="">No store</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.email ? `(${s.email})` : ''}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={isPending || !form.productId}
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
        {isPending ? 'Creating…' : 'Create checkout link'}
      </button>

      {linkUrl && (
        <button
          type="button"
          onClick={copyLink}
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          Copy link
        </button>
      )}

      {message && <p style={{ color: 'green', margin: 0 }}>{message}</p>}
      {error && <p style={{ color: '#b00', margin: 0 }}>{error}</p>}
    </form>
  );
}
