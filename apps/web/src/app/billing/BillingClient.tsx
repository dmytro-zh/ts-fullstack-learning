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
        <section className={styles.panel}>
          <div className={styles.hero}>
            <span className={styles.badge}>Billing</span>
            <Text as="h1" variant="title" className={styles.heading}>
              Your plan, made simple.
            </Text>
            <Text as="p" variant="muted" className={styles.subheading}>
              Start on Free, upgrade when you need higher limits. Stripe runs in test mode for now.
            </Text>
            <div className={styles.heroMeta}>
              <span>Limits apply to stores, products, and checkout links.</span>
              <span className={styles.metaDivider}>•</span>
              <span>Cancel anytime.</span>
            </div>
          </div>

          {statusMessage ? (
            <div className={`${styles.banner} ${styles.bannerSuccess}`}>{statusMessage}</div>
          ) : null}
          {errorText ? (
            <div className={`${styles.banner} ${styles.bannerError}`}>{errorText}</div>
          ) : null}

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.planHeader}>
                <span className={styles.planTag}>Free</span>
                <div className={styles.planTitle}>Starter</div>
                <div className={styles.planPrice}>
                  <span className={styles.planPriceValue}>$0</span>
                  <span className={styles.planPriceUnit}>/ month</span>
                </div>
                <p className={styles.planDesc}>No card required.</p>
              </div>
              <div className={styles.planBody}>
                <ul className={styles.featureList}>
                  {FREE_FEATURES.map((item) => (
                    <li key={item} className={styles.featureItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.footerNote}>No credit card required.</span>
              </div>
            </div>

            <div className={`${styles.card} ${styles.cardHighlight}`}>
              <span className={styles.popularPill}>Most popular</span>
              <div className={styles.planHeader}>
                <span className={styles.planTag}>Pro</span>
                <div className={styles.planTitle}>Unlimited</div>
                <div className={styles.planPrice}>
                  <span className={styles.planPriceValue}>$29</span>
                  <span className={styles.planPriceUnit}>/ month (test)</span>
                </div>
                <p className={styles.planDesc}>Best for active merchants.</p>
              </div>
              <div className={styles.planBody}>
                <ul className={styles.featureList}>
                  {PRO_FEATURES.map((item) => (
                    <li key={item} className={styles.featureItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.actions}>
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => void onUpgrade()}
                    disabled={submitting}
                    className={styles.upgradeButton}
                    data-testid="billing-upgrade"
                  >
                    {submitting ? 'Starting checkout...' : 'Upgrade to Pro'}
                  </Button>
                  <span className={styles.actionNote}>Charged in Stripe test mode.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
