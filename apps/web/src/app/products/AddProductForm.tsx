'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import type { Store } from '../../graphql/generated/graphql';
import { addProductAction } from '../actions/addProduct';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import styles from './AddProductForm.module.css';

type StoreOption = Pick<Store, 'id' | 'name' | 'email'>;

export function AddProductForm({ stores }: { stores: StoreOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    price: '0',
    storeId: stores[0]?.id ?? '',
    description: '',
    imageUrl: '',
    quantity: '0',
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const priceNumber = Number(form.price);
    if (Number.isNaN(priceNumber)) {
      setError('Price must be a number');
      return;
    }

    const quantityNumber = Number(form.quantity);
    if (Number.isNaN(quantityNumber) || !Number.isInteger(quantityNumber) || quantityNumber < 0) {
      setError('Quantity must be a non-negative integer');
      return;
    }

    if (!form.storeId) {
      setError('Store is required');
      return;
    }

    startTransition(async () => {
      try {
        await addProductAction({
          name: form.name,
          price: priceNumber,
          storeId: form.storeId,
          description: form.description || undefined,
          imageUrl: form.imageUrl || undefined,
          quantity: quantityNumber,
        });

        setForm((p) => ({
          ...p,
          name: '',
          price: '0',
          description: '',
          imageUrl: '',
          quantity: '0',
        }));

        setMessage(
          'Product has been created. You can now use it on the home page and in checkout links.',
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save product');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className={styles.form} data-testid="add-product-form">
      {error && (
        <p className={`${styles.alert} ${styles.alertError}`} data-testid="add-product-error">
          {error}
        </p>
      )}

      {message && (
        <p className={`${styles.alert} ${styles.alertSuccess}`} data-testid="add-product-success">
          {message}
        </p>
      )}

      <label className={styles.label}>
        <span className={styles.labelText}>Name</span>
        <Input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
          placeholder="Blue hoodie"
          data-testid="add-product-name"
        />
      </label>

      <label className={styles.label}>
        <span className={styles.labelText}>Price</span>
        <Input
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          required
          data-testid="add-product-price"
        />
      </label>

      <label className={styles.label}>
        <span className={styles.labelText}>Quantity</span>
        <Input
          type="number"
          min={0}
          step={1}
          value={form.quantity}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              setForm((p) => ({ ...p, quantity: '' }));
              return;
            }
            const numeric = Number(value);
            if (!Number.isNaN(numeric) && numeric >= 0) {
              setForm((p) => ({ ...p, quantity: String(Math.floor(numeric)) }));
            }
          }}
          data-testid="add-product-quantity"
        />
      </label>

      <label className={styles.label}>
        <span className={styles.labelText}>Store (required)</span>
        <Select
          value={form.storeId}
          onChange={(e) => setForm((p) => ({ ...p, storeId: e.target.value }))}
          required
          data-testid="add-product-store"
        >
          <option value="">Select store</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.email ? `(${s.email})` : ''}
            </option>
          ))}
        </Select>
        {stores.length === 0 && (
          <small className={styles.helper}>Create a store first at /stores.</small>
        )}
      </label>

      <label className={styles.label}>
        <span className={styles.labelText}>Description (optional)</span>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={4}
          placeholder="Soft cotton hoodie with embroidered logo."
          data-testid="add-product-description"
        />
      </label>

      <label className={styles.label}>
        <span className={styles.labelText}>Image URL (optional)</span>
        <Input
          value={form.imageUrl}
          onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
          placeholder="https://example.com/image.jpg"
          data-testid="add-product-image-url"
        />
      </label>

      {form.imageUrl && (
        <div className={styles.preview}>
          <Image
            src={form.imageUrl}
            alt="preview"
            width={400}
            height={400}
            className={styles.previewImage}
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending || !form.storeId}
        className={styles.submit}
        data-testid="add-product-submit"
      >
        {isPending ? 'Saving…' : 'Add product'}
      </Button>
    </form>
  );
}
