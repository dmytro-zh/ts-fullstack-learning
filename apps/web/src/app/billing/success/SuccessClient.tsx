'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { Text } from '../../../components/ui/Text';
import styles from './page.module.css';

const NEXT_STEPS = [
  'We are syncing your plan with Stripe.',
  'You can start using Pro limits right away.',
  'If the plan does not update in a minute, refresh Billing.',
];

export default function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const shortSession = useMemo(() => {
    if (!sessionId) return null;
    if (sessionId.length <= 14) return sessionId;
    return `${sessionId.slice(0, 8)}…${sessionId.slice(-4)}`;
  }, [sessionId]);

  return (
    <section className={styles.panel}>
      <span className={styles.badge}>Billing</span>

      <div className={styles.hero}>
        <span className={styles.checkmark} aria-hidden="true" />
        <div className={styles.heroText}>
          <Text as="h1" variant="title" className={styles.heading}>
            Payment received. Welcome to Pro.
          </Text>
          <Text as="p" variant="muted" className={styles.subheading}>
            Thanks for upgrading. We will finish syncing your plan in the background.
          </Text>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.statusCard}>
          <div className={styles.statusTitle}>Status: syncing</div>
          <div className={styles.statusBody}>
            Stripe is processing the subscription. This usually completes in a few seconds.
          </div>
        </div>

        <div className={styles.stepsCard}>
          <div className={styles.stepsTitle}>What happens next</div>
          <ul className={styles.stepsList}>
            {NEXT_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      </div>

      {shortSession ? (
        <div className={styles.sessionMeta}>
          Checkout session <span className={styles.sessionCode}>{shortSession}</span>
        </div>
      ) : null}

      <div className={styles.actions}>
        <Button
          type="button"
          size="lg"
          onClick={() => router.push('/dashboard')}
          className={styles.primaryButton}
          data-testid="billing-success-dashboard"
        >
          Go to dashboard
        </Button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => router.push('/billing')}
          data-testid="billing-success-billing"
        >
          Back to Billing
        </button>
      </div>

      <div className={styles.supportNote}>
        Need help? Contact support and include the session ID if available.
      </div>
    </section>
  );
}
