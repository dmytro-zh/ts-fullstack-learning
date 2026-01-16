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
  initialStoreId?: string | undefined;
};

function slugify(storeName: string, productName: string) {
  return `${storeName}-${productName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function CheckoutLinksForm({ products, stores, initialProductId, initialStoreId }: Props) {
  const initialProduct = useMemo(() => {
    if (initialProductId) {
      return products.find((p) => p.id === initialProductId) ?? products[0];
    }
    if (initialStoreId) {
      return products.find((p) => p.storeId === initialStoreId) ?? products[0];
    }
    return products[0];
  }, [products, initialProductId, initialStoreId]);

  const initialStore = useMemo(() => {
    if (initialStoreId) {
      return (
        stores.find((s) => s.id === initialStoreId) ??
        (initialProduct
          ? (stores.find((s) => s.id === initialProduct.storeId) ?? stores[0])
          : stores[0])
      );
    }
    if (initialProduct) {
      return stores.find((s) => s.id === initialProduct.storeId) ?? stores[0];
    }
    return stores[0];
  }, [stores, initialStoreId, initialProduct]);

  const storeLocked = Boolean(initialStoreId);
  const productLocked = Boolean(initialProductId);

  const [form, setForm] = useState({
    slug: initialStore && initialProduct ? slugify(initialStore.name, initialProduct.name) : '',
    productId: initialProduct?.id ?? '',
    storeId: initialStore?.id ?? '',
  });

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (storeLocked && form.storeId) {
      return products.filter((p) => p.storeId === form.storeId);
    }
    return products;
  }, [products, storeLocked, form.storeId]);

  const currentProduct =
    filteredProducts.find((p) => p.id === form.productId) ?? filteredProducts[0] ?? products[0];

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
    const product = filteredProducts.find((p) => p.id === productId);
    const store = stores.find((s) => s.id === product?.storeId) ?? null;
    setForm((p) => ({
      ...p,
      productId,
      storeId: storeLocked ? p.storeId : (store?.id ?? p.storeId),
      slug:
        product && (storeLocked ? initialStore : store)
          ? slugify((storeLocked ? initialStore : store)!.name, product.name)
          : p.slug,
    }));
  };

  const copyLink = () => {
    if (linkUrl) {
      void navigator.clipboard.writeText(linkUrl);
      setMessage(`Link copied: ${linkUrl}`);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'grid', gap: 12 }}
      data-testid="checkout-links-form"
    >
      <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
        <span style={{ color: '#111827' }}>Slug</span>
        <input
          value={form.slug}
          onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
          required
          placeholder="my-store-product"
          data-testid="checkout-links-slug"
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
        {productLocked && currentProduct ? (
          <input
            value={`${currentProduct.name} ($${currentProduct.price.toFixed(2)})`}
            disabled
            data-testid="checkout-links-product"
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              color: '#0f172a',
            }}
          />
        ) : (
          <select
            value={form.productId}
            onChange={(e) => handleProductChange(e.target.value)}
            data-testid="checkout-links-product"
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#0f172a',
            }}
          >
            {filteredProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (${p.price.toFixed(2)})
              </option>
            ))}
          </select>
        )}
      </label>

      <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
        <span style={{ color: '#111827' }}>Store</span>
        <select
          value={form.storeId}
          onChange={(e) => setForm((p) => ({ ...p, storeId: e.target.value }))}
          disabled={storeLocked}
          data-testid="checkout-links-store"
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: storeLocked ? '#f9fafb' : '#fff',
            color: '#0f172a',
          }}
        >
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
        data-testid="checkout-links-submit"
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
          data-testid="checkout-links-copy"
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

      {message && (
        <p style={{ color: 'green', margin: 0 }} data-testid="checkout-links-message">
          {message}
        </p>
      )}
      {error && (
        <p style={{ color: '#b00', margin: 0 }} data-testid="checkout-links-error">
          {error}
        </p>
      )}
    </form>
  );
}
