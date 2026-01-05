'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, useTransition } from 'react';
import type { CheckoutLinkQuery } from '../../../graphql/generated/graphql';
import { checkoutByLinkAction, type CheckoutByLinkInput } from '../../actions/checkoutByLink';

type CheckoutLinkData = NonNullable<CheckoutLinkQuery['checkoutLink']>;

type FormState = {
  name: string;
  email: string;
  quantity: string;
  shippingAddress: string;
  shippingNote: string;
};

type UiImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

function normalizeImages(product: CheckoutLinkData['product']): UiImage[] {
  const imgs = product.images ?? [];
  return imgs
    .filter((i) => Boolean(i?.url))
    .map((i) => ({
      id: i.id,
      url: i.url,
      isPrimary: Boolean(i.isPrimary),
    }));
}

function getInitialActiveIndex(images: UiImage[]): number {
  if (images.length === 0) return 0;
  const idx = images.findIndex((i) => i.isPrimary);
  return idx >= 0 ? idx : 0;
}

export function CheckoutLinkView({ link }: { link: CheckoutLinkData }) {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    quantity: '1',
    shippingAddress: '',
    shippingNote: '',
  });

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const p = link.product;
  const disabled = !p.inStock;

  const images = useMemo(() => normalizeImages(p), [p]);

  const initialIndex = useMemo(() => getInitialActiveIndex(images), [images]);
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);

  // Keep activeIndex valid if images list changes (rare, but safe)
  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  const activeImageUrl = images[activeIndex]?.url ?? null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const quantityNumber = Number(form.quantity) || 1;

        const payload: CheckoutByLinkInput = {
          slug: link.slug,
          customerName: form.name,
          email: form.email,
          quantity: quantityNumber,
          shippingAddress: form.shippingAddress,
        };

        const trimmedNote = form.shippingNote.trim();
        if (trimmedNote) payload.shippingNote = trimmedNote;

        const order = await checkoutByLinkAction(payload);
        window.location.href = `/thank-you/${order.id}`;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed');
      }
    });
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Product section */}
      <div
        style={{
          padding: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          background: '#f9fafb',
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>{p.name}</div>

          <div style={{ color: '#374151' }}>
            ${p.price.toFixed(2)} {p.inStock ? '(in stock)' : '(out of stock)'}
          </div>

          {link.store ? (
            <div style={{ color: '#6b7280' }}>
              Store: {link.store.name} {link.store.email ? `(${link.store.email})` : ''}
            </div>
          ) : null}
        </div>

        {/* Gallery + description */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: images.length > 0 ? '280px 1fr' : '1fr',
            gap: 16,
            alignItems: 'start',
          }}
        >
          {images.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {/* Preview */}
              {activeImageUrl ? (
                <div
                  style={{
                    width: 280,
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={activeImageUrl}
                    alt={p.name}
                    width={280}
                    height={280}
                    style={{
                      width: 280,
                      height: 280,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    priority
                  />
                </div>
              ) : null}

              {/* Thumbnails */}
              {images.length > 1 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {images.map((img, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`Select image ${idx + 1}`}
                        style={{
                          padding: 0,
                          border: isActive ? '2px solid #2563eb' : '1px solid #d1d5db',
                          borderRadius: 8,
                          background: '#fff',
                          cursor: 'pointer',
                          width: 56,
                          height: 56,
                          overflow: 'hidden',
                        }}
                      >
                        <Image
                          src={img.url}
                          alt=""
                          width={56}
                          height={56}
                          style={{
                            width: 56,
                            height: 56,
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: 10 }}>
            {p.description ? <p style={{ margin: 0, color: '#111827' }}>{p.description}</p> : null}

            {/* Temporary legacy fallback note (optional)
                If you want: show imageUrl if images are empty.
                For now we intentionally do NOT render imageUrl to enforce the new images system.
            */}
          </div>
        </div>
      </div>

      {/* Checkout form */}
      <div
        style={{
          padding: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          background: '#fff',
          display: 'grid',
          gap: 10,
        }}
      >
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
            <span>Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="John Doe"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
              placeholder="you@example.com"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
            <span>Quantity</span>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
              required
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
            <span>Shipping address</span>
            <textarea
              value={form.shippingAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, shippingAddress: e.target.value }))}
              required
              placeholder="Street, city, postal code, country"
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                minHeight: 70,
                resize: 'vertical',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
            <span>Note (optional)</span>
            <textarea
              value={form.shippingNote}
              onChange={(e) => setForm((prev) => ({ ...prev, shippingNote: e.target.value }))}
              placeholder="Any additional instructions for shipping"
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                minHeight: 60,
                resize: 'vertical',
              }}
            />
          </label>

          <button
            type="submit"
            disabled={isPending || disabled}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #1d4ed8',
              background: disabled ? '#e5e7eb' : isPending ? '#dbeafe' : '#2563eb',
              color: disabled ? '#9ca3af' : '#fff',
              fontWeight: 700,
              cursor: disabled ? 'not-allowed' : isPending ? 'wait' : 'pointer',
              width: '100%',
            }}
          >
            {disabled ? 'Out of stock' : isPending ? 'Processing...' : 'Buy now'}
          </button>

          {message ? <p style={{ color: 'green', margin: 0 }}>{message}</p> : null}
          {error ? <p style={{ color: '#b00', margin: 0 }}>{error}</p> : null}
        </form>
      </div>
    </div>
  );
}
