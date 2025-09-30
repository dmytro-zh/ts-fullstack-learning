'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addProductAction } from '../actions/addProduct';

export default function AddProductPage() {
  const router = useRouter();
  const [formState, setFormState] = useState({ name: '', price: '0', inStock: true });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const priceNumber = Number(formState.price);
    if (Number.isNaN(priceNumber)) {
      setSubmitting(false);
      return setError('Price must be a number');
    }

    try {
      await addProductAction({
        name: formState.name,
        price: priceNumber,
        inStock: formState.inStock,
      });
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubmitting(false);
    }
  };

  return (
    <main style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>Add Product</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 320 }}>
        <label>
          Name
          <input
            value={formState.name}
            onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </label>

        <label>
          Price
          <input
            type="number"
            step="0.01"
            value={formState.price}
            onChange={(e) => setFormState((prev) => ({ ...prev, price: e.target.value }))}
            required
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={formState.inStock}
            onChange={(e) => setFormState((prev) => ({ ...prev, inStock: e.target.checked }))}
          />
          In stock
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add product'}
        </button>

        {error && <p style={{ color: '#b00' }}>{error}</p>}
      </form>
    </main>
  );
}
