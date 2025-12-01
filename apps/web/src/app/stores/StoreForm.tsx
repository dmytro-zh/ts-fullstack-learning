'use client';

import { useState, useTransition } from 'react';
import { createStoreAction } from '../actions/createStore';

export function StoreForm() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await createStoreAction({ name: form.name, email: form.email || undefined });
        setMessage('Store created');
        setForm({ name: '', email: '' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Create store failed');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>Stores</h1>
      <label>
        Name
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />
      </label>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Create store'}
      </button>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: '#b00' }}>{error}</p>}
    </form>
  );
}
