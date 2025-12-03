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
  const [description, setDescription] = useState(product.description ?? '');
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setMessage(null);
    setError(null);

    const priceNumber = Number(price.replace(',', '.'));
    if (Number.isNaN(priceNumber)) {
      setError('Price must be a number');
      return;
    }

    try {
      await updateProductAction({
        id: product.id,
        price: priceNumber,
        inStock,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
      });
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
          href={`/checkout-links?productId=${product.id}`}
          style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
        >
          Create checkout link
        </Link>
      </div>

      {/* Price */}
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

      {/* Custom checkbox */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 600,
          color: '#0f172a',
          position: 'relative',
        }}
      >
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            margin: 0,
            cursor: 'pointer',
          }}
        />
        <span
          style={{
            width: 16,
            height: 16,
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#2563eb',
            boxSizing: 'border-box',
          }}
        >
          {inStock ? '✓' : ''}
        </span>
        <span>In stock</span>
      </label>

      {/* Description */}
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

      {/* Image URL */}
      <label style={labelStyle}>
        Image URL
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          style={inputBaseStyle}
        />
      </label>

      {/* Preview */}
      {imageUrl ? (
        <div style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Preview</span>
          <img
            src={imageUrl}
            alt={product.name}
            style={{
              maxWidth: '100%',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              display: 'block',
            }}
          />
        </div>
      ) : null}

      {/* Save */}
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