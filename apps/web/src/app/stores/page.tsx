import Link from 'next/link';
import { redirect } from 'next/navigation';
import { StoresDocument, type StoresQuery } from '../../graphql/generated/graphql';
import { createWebGraphQLClient } from '../../lib/graphql-client';
import { createStoreAction as createStoreMutation } from '../actions/createStore';
import buttonStyles from '../../components/ui/Button.module.css';
import inputStyles from '../../components/ui/Input.module.css';
import styles from './page.module.css';

async function fetchStores() {
  const client = await createWebGraphQLClient();
  const data = await client.request<StoresQuery>(StoresDocument);
  return data.stores ?? [];
}

async function createStoreAction(formData: FormData) {
  'use server';

  const rawName = String(formData.get('name') ?? '');
  const rawEmail = String(formData.get('email') ?? '');

  const name = rawName.trim();
  const email = rawEmail.trim();

  if (!name) {
    redirect('/stores?error=1');
  }

  try {
    await createStoreMutation({ name, email: email || undefined });
  } catch (err) {
    console.error('Failed to create store', err);
    redirect('/stores?error=1');
  }

  redirect('/stores?created=1');
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const wasCreated = params.created === '1';
  const hasError = !wasCreated && params.error === '1';

  const stores = await fetchStores();

  return (
    <main className={styles.page} data-testid="stores-page">
      <div className={styles.card} data-testid="stores-card">
        <h1 className={styles.title} data-testid="stores-title">
          Create store
        </h1>

        {wasCreated && (
          <p
            className={`${styles.alert} ${styles.alertSuccess}`}
            data-testid="stores-alert-success"
          >
            Store has been created. You can now attach products to this store and receive orders.
          </p>
        )}

        {hasError && (
          <p className={`${styles.alert} ${styles.alertError}`} data-testid="stores-alert-error">
            Failed to create store. Please try again.
          </p>
        )}

        <form action={createStoreAction} className={styles.form} data-testid="stores-form">
          <label className={styles.label}>
            Name
            <input
              name="name"
              required
              placeholder="For example: Cozy Scarves Studio"
              className={`${inputStyles.field} ${inputStyles.sizeMd}`}
              data-testid="stores-name"
            />
          </label>

          <label className={styles.label}>
            Email (optional)
            <input
              name="email"
              type="email"
              placeholder="owner@example.com"
              className={`${inputStyles.field} ${inputStyles.sizeMd}`}
              data-testid="stores-email"
            />
          </label>

          <button
            type="submit"
            className={`${buttonStyles.button} ${buttonStyles.variantPrimary} ${buttonStyles.sizeMd} ${buttonStyles.shapeRounded}`}
            data-testid="stores-submit"
          >
            Create store
          </button>
        </form>

        <div className={styles.listSection} data-testid="stores-list">
          <h2 className={styles.subtitle} data-testid="stores-list-title">
            Existing stores
          </h2>
          {stores.length === 0 ? (
            <p className={styles.empty} data-testid="stores-empty">
              No stores yet.
            </p>
          ) : (
            <ul className={styles.list} data-testid="stores-items">
              {stores.map((s) => (
                <li key={s.id} className={styles.storeItem}>
                  <div className={styles.storeRow}>
                    <span>
                      {s.name}
                      {s.email ? ` (${s.email})` : ''}
                      {s.isActive === false ? ' (Blocked)' : ''}
                    </span>

                    <Link
                      href={`/orders?store=${encodeURIComponent(s.id)}`}
                      className={`${buttonStyles.button} ${buttonStyles.variantPrimary} ${buttonStyles.sizeSm} ${buttonStyles.shapePill}`}
                    >
                      View orders
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
