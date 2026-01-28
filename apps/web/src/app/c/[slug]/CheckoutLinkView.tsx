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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    quantity: '1',
    shippingAddress: '',
    shippingNote: '',
  });

  const [isPending, startTransition] = useTransition();
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

  const updateField =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
      if (fieldErrors[key]) {
        setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    };

  function validate(form: FormState) {
    const errors: Partial<Record<keyof FormState, string>> = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const address = form.shippingAddress.trim();
    const quantity = Number(form.quantity);

    if (name.length < 2) errors.name = 'Name must be at least 2 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';
    if (address.length < 10) errors.shippingAddress = 'Shipping address is too short.';
    if (!Number.isInteger(quantity) || quantity < 1)
      errors.quantity = 'Quantity must be at least 1.';

    return errors;
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    setError(null);

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    startTransition(async () => {
      try {
        const payload: CheckoutByLinkInput = {
          slug: link.slug,
          customerName: form.name.trim(),
          email: form.email.trim(),
          quantity: Number(form.quantity) || 1,
          shippingAddress: form.shippingAddress.trim(),
        };

        const trimmedNote = form.shippingNote.trim();
        if (trimmedNote) payload.shippingNote = trimmedNote;

        const result = await checkoutByLinkAction(payload);
        const token = encodeURIComponent(result.receiptToken);
        window.location.href = `/thank-you/${result.order.id}?token=${token}`;
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
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }} data-testid="checkout-form">
          <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
            <span>Name</span>
            <input
              value={form.name}
              onChange={updateField('name')}
              required
              placeholder="John Doe"
              data-testid="checkout-name"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            {fieldErrors.name ? (
              <p style={{ color: '#b00', margin: 0 }}>{fieldErrors.name}</p>
            ) : null}
          </label>

          <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={updateField('email')}
              required
              placeholder="you@example.com"
              data-testid="checkout-email"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            {fieldErrors.email ? (
              <p style={{ color: '#b00', margin: 0 }}>{fieldErrors.email}</p>
            ) : null}
          </label>

          <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
            <span>Quantity</span>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={updateField('quantity')}
              required
              placeholder="1"
              data-testid="checkout-quantity"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            {fieldErrors.quantity ? (
              <p style={{ color: '#b00', margin: 0 }}>{fieldErrors.quantity}</p>
            ) : null}
          </label>

          <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
            <span>Shipping address</span>
            <textarea
              value={form.shippingAddress}
              onChange={updateField('shippingAddress')}
              required
              placeholder="Street, city, postal code, country"
              data-testid="checkout-shipping-address"
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                minHeight: 70,
                resize: 'vertical',
              }}
            />
            {fieldErrors.shippingAddress ? (
              <p style={{ color: '#b00', margin: 0 }}>{fieldErrors.shippingAddress}</p>
            ) : null}
          </label>

          <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
            <span>Note (optional)</span>
            <textarea
              value={form.shippingNote}
              onChange={updateField('shippingNote')}
              placeholder="Any additional instructions for shipping"
              data-testid="checkout-note"
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
            data-testid="checkout-submit"
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

          {error ? <p style={{ color: '#b00', margin: 0 }}>{error}</p> : null}
        </form>
      </div>
    </div>
  );
}
