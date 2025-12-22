'use client';

import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ProductByIdQuery } from '../../../graphql/generated/graphql';
import { updateProductAction } from '../../actions/updateProduct';

type ProductData = NonNullable<ProductByIdQuery['product']>;

function pickPrimaryImage(product: ProductData) {
  const images = product.images ?? [];
  const primary = images.find((img) => img.isPrimary) ?? images[0] ?? null;
  return primary;
}

export function ProductDetails({ product }: { product: ProductData }) {
  const router = useRouter();

  const [price, setPrice] = useState(String(product.price));
  const [description, setDescription] = useState(product.description ?? '');
  const [quantity, setQuantity] = useState(String(product.quantity ?? 0));

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const storeId = product.store?.id ?? null;

  const quantityNumber = Number(quantity);
  const isInStock =
    !Number.isNaN(quantityNumber) && Number.isFinite(quantityNumber) && quantityNumber > 0;

  const primaryImage = useMemo(() => pickPrimaryImage(product), [product]);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:4000';

  const onSave = async () => {
    setMessage(null);
    setError(null);

    const priceNumber = Number(price.replace(',', '.'));
    if (Number.isNaN(priceNumber)) {
      setError('Price must be a number');
      return;
    }

    const quantityNumberLocal = Number(quantity);
    if (
      Number.isNaN(quantityNumberLocal) ||
      !Number.isInteger(quantityNumberLocal) ||
      quantityNumberLocal < 0
    ) {
      setError('Quantity must be a non-negative integer');
      return;
    }

    try {
      await updateProductAction({
        id: product.id,
        price: priceNumber,
        description: description || undefined,
        quantity: quantityNumberLocal,
      });
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const onPickFile = () => {
    setMessage(null);
    setError(null);
    fileInputRef.current?.click();
  };

  const onUploadSelected = async (file: File) => {
    setMessage(null);
    setError(null);
    setIsUploading(true);

    try {
      const form = new FormData();
      form.append('productId', product.id);
      form.append('makePrimary', 'true');
      form.append('file', file);

      const res = await fetch(`${apiBaseUrl}/uploads/product-image`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Upload failed (${res.status})`);
      }

      setMessage('Image uploaded');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const inputBaseStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#0f172a',
    caretColor: '#2563eb',
    fontSize: 14,
    lineHeight: 1.4,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'grid',
    gap: 6,
    fontWeight: 600,
    color: '#0f172a',
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
        display: 'grid',
        gap: 14,
        color: '#0f172a',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>{product.name}</h1>
          <p style={{ margin: '4px 0', color: '#475569' }}>
            Store:{' '}
            {product.store
              ? `${product.store.name}${product.store.email ? ` (${product.store.email})` : ''}`
              : 'No store'}
          </p>
        </div>
        <Link
          href={
            storeId
              ? `/checkout-links?productId=${encodeURIComponent(product.id)}&store=${encodeURIComponent(
                  storeId,
                )}`
              : `/checkout-links?productId=${encodeURIComponent(product.id)}`
          }
          style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
        >
          Create checkout link
        </Link>
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: isInStock ? '#166534' : '#b91c1c',
        }}
      >
        Status: {isInStock ? 'In stock' : 'Out of stock'}
      </div>

      {/* Image block */}
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700 }}>Product image</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file) void onUploadSelected(file);
              }}
            />
            <button
              type="button"
              onClick={onPickFile}
              disabled={isUploading}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid rgba(209,213,219,0.95)',
                background: isUploading ? '#f3f4f6' : '#ffffff',
                color: '#111827',
                fontWeight: 700,
                cursor: isUploading ? 'not-allowed' : 'pointer',
              }}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        <div
          style={{
            borderRadius: 14,
            border: '1px solid rgba(229,231,235,0.95)',
            background: '#f9fafb',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 10',
            }}
          >
            {primaryImage?.url ? (
              <Image
                src={primaryImage.url}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 720px"
                style={{ objectFit: 'cover' }}
                priority
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#6b7280',
                  fontSize: 13,
                  background: 'linear-gradient(135deg, #f8fafc 0, #eef2ff 100%)',
                }}
              >
                No image yet. Upload one to make it shine.
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#6b7280' }}>
          Tip: first uploaded image becomes primary for now.
        </div>
      </div>

      <label style={labelStyle}>
        Price
        <input
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="49.99"
          style={inputBaseStyle}
        />
      </label>

      <label style={labelStyle}>
        Quantity
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={quantity}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              setQuantity('');
              return;
            }
            const numeric = Number(value);
            if (!Number.isNaN(numeric) && numeric >= 0) {
              setQuantity(String(Math.floor(numeric)));
            }
          }}
          placeholder="0"
          style={inputBaseStyle}
        />
      </label>

      <label style={labelStyle}>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Short description for your buyers..."
          style={{
            ...inputBaseStyle,
            resize: 'vertical',
            minHeight: 96,
          }}
        />
      </label>

      <button
        type="button"
        onClick={onSave}
        style={{
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid #1d4ed8',
          background: '#2563eb',
          color: '#ffffff',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Save
      </button>

      {message && <p style={{ color: '#16a34a', margin: 0 }}>{message}</p>}
      {error && <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p>}
    </div>
  );
}
