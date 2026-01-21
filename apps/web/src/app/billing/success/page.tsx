import { Suspense } from 'react';
import SuccessClient from './SuccessClient';
import styles from './page.module.css';

export default function BillingSuccessPage() {
  return (
    <main className={styles.page} data-testid="billing-success-page">
      <div className={styles.container}>
        <Suspense fallback={null}>
          <SuccessClient />
        </Suspense>
      </div>
    </main>
  );
}
