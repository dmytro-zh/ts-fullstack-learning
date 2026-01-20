'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { Text } from '../../components/ui/Text';
import styles from './page.module.css';

const FREE_FEATURES = ['1 store', '10 products', '3 checkout links', 'Basic analytics'];
const PRO_FEATURES = [
  'Unlimited stores',
  'Unlimited products',
  'Unlimited checkout links',
  'Priority support',
];

export default function BillingClient() {
  const searchParams = useSearchParams();

  const status = searchParams.get('status');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const statusMessage = useMemo(() => {
    if (status === 'success') return 'Checkout created. We will sync your plan after payment.';
    if (status === 'cancelled') return 'Checkout cancelled. You can try again anytime.';
    return null;
  }, [status]);

  const onUpgrade = async () => {
    setErrorText(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/billing/checkout-session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 401) {
          setErrorText('Please sign in to upgrade.');
        } else if (res.status === 403) {
          setErrorText('Only merchants can upgrade.');
        } else {
          setErrorText(`Failed to start checkout: ${text}`);
        }
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        setErrorText('Stripe session is missing URL.');
        return;
      }

      window.location.href = data.url;
    } catch {
      setErrorText('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page} data-testid="billing-page">
      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Billing
          </div>
          <Text as="h1" variant="title" className={styles.heading}>
            Your plan, made simple.
          </Text>
          <Text as="p" variant="muted" className={styles.subheading}>
            Upgrade to Pro to remove all limits. Stripe runs in test mode for now.
          </Text>
        </div>

        {statusMessage ? <div className={styles.status}>{statusMessage}</div> : null}
        {errorText ? <div className={styles.error}>{errorText}</div> : null}

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardTag}>Free</div>
            <div className={styles.cardTitle}>Starter</div>
            <div className={styles.cardPrice}>$0 / month</div>
            <ul className={styles.list}>
              {FREE_FEATURES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={`${styles.card} ${styles.cardHighlight}`}>
            <div className={styles.cardTag}>Pro</div>
            <div className={styles.cardTitle}>Unlimited</div>
            <div className={styles.cardPrice}>$29 / month (test)</div>
            <ul className={styles.list}>
              {PRO_FEATURES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className={styles.actions}>
              <Button
                type="button"
                size="lg"
                onClick={() => void onUpgrade()}
                disabled={submitting}
                data-testid="billing-upgrade"
              >
                {submitting ? 'Starting checkout...' : 'Upgrade to Pro'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
