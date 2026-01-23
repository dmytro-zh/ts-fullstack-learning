'use client';

import { useMemo, useState, useEffect } from 'react';
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

type BillingMe = {
  ok: true;
  plan: 'FREE' | 'PRO';
  subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

type BillingClientProps = {
  initialBilling?: BillingMe | null;
  initialBillingError?: string | null;
};

export default function BillingClient({
  initialBilling = null,
  initialBillingError = null,
}: BillingClientProps) {
  const searchParams = useSearchParams();

  const status = searchParams.get('status');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [billing, setBilling] = useState<BillingMe | null>(initialBilling);
  const [billingError, setBillingError] = useState<string | null>(initialBillingError);
  const [billingLoading, setBillingLoading] = useState(
    initialBilling === null && !initialBillingError,
  );

  const statusMessage = useMemo(() => {
    if (status === 'success') return 'Checkout created. We will sync your plan after payment.';
    if (status === 'cancelled') return 'Checkout cancelled. You can try again anytime.';
    return null;
  }, [status]);

  useEffect(() => {
    if (initialBilling !== null || initialBillingError) return;

    let cancelled = false;

    void (async () => {
      try {
        setBillingLoading(true);
        const res = await fetch('/api/billing/me', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setBillingError('Failed to load billing status.');
          return;
        }
        const data = (await res.json()) as BillingMe;
        if (!cancelled) setBilling(data);
      } catch {
        if (!cancelled) setBillingError('Failed to load billing status.');
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialBilling, initialBillingError]);

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

  const isReady = !billingLoading && !billingError && billing !== null;
  const canShowActions = isReady || Boolean(billingError);
  const plan = billing?.plan ?? null;
  const subscriptionStatus = billing?.subscriptionStatus ?? null;
  const isPro = plan === 'PRO';
  const showFree =
    isReady &&
    (plan === 'FREE' || subscriptionStatus === 'PAST_DUE' || subscriptionStatus === 'CANCELED');
  const showUpgrade =
    isReady &&
    (plan === 'FREE' || subscriptionStatus === 'PAST_DUE' || subscriptionStatus === 'CANCELED');
  const currentPlanLabel = plan === 'PRO' ? 'Monthly billing' : 'Current plan';
  const statusPillLabel =
    subscriptionStatus === 'ACTIVE'
      ? 'Subscribed'
      : subscriptionStatus === 'PAST_DUE'
        ? 'Past due'
        : subscriptionStatus === 'CANCELED'
          ? 'Canceled'
          : null;
  const showStatusWarning =
    isReady && (subscriptionStatus === 'PAST_DUE' || subscriptionStatus === 'CANCELED');
  const warningText =
    subscriptionStatus === 'PAST_DUE'
      ? 'Your subscription is past due. Resume Pro to restore access.'
      : subscriptionStatus === 'CANCELED'
        ? 'Your subscription was canceled. Resume Pro to restore access.'
        : null;
  const showProActive = isReady && plan === 'PRO' && subscriptionStatus === 'ACTIVE';
  const upgradeLabel =
    subscriptionStatus === 'PAST_DUE' || subscriptionStatus === 'CANCELED'
      ? 'Resume Pro'
      : 'Upgrade to Pro';
  const subheadingText = 'Current plan and limits.';
  const metaText = 'Applies to stores, products, and checkout links.';
  const heroClassName = !showFree ? `${styles.hero} ${styles.heroCentered}` : styles.hero;
  const panelClassName = !showFree ? `${styles.panel} ${styles.panelCompact}` : styles.panel;

  return (
    <main className={styles.page} data-testid="billing-page">
      <div className={styles.container}>
        <section className={panelClassName}>
          <div className={heroClassName}>
            <span className={styles.badge}>Billing</span>
            <Text as="h1" variant="title" className={styles.heading}>
              Plan & billing.
            </Text>
            <Text as="p" variant="muted" className={styles.subheading}>
              {subheadingText}
            </Text>
            <div className={styles.heroMeta}>
              <span>{metaText}</span>
              <span className={styles.metaDivider}>•</span>
              <span>Cancel anytime.</span>
            </div>
          </div>

          {statusMessage ? (
            <div className={`${styles.banner} ${styles.bannerSuccess}`}>{statusMessage}</div>
          ) : null}

          {showStatusWarning && warningText ? (
            <div className={`${styles.banner} ${styles.bannerWarning}`}>{warningText}</div>
          ) : null}

          {errorText ? (
            <div className={`${styles.banner} ${styles.bannerError}`}>{errorText}</div>
          ) : null}

          {billingError ? (
            <div className={`${styles.banner} ${styles.bannerError} ${styles.bannerCompact}`}>
              {billingError}
            </div>
          ) : null}

          {isReady || billingError ? (
            <div className={`${styles.grid} ${!showFree ? styles.gridSingle : ''}`}>
              {showFree ? (
                <div className={styles.card}>
                  <div className={styles.planHeader}>
                    <span className={styles.planTag}>Free</span>
                    {plan === 'FREE' ? (
                      <span className={styles.currentPill} data-testid="billing-current-plan">
                        {currentPlanLabel}
                      </span>
                    ) : null}
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
              ) : null}

              <div className={`${styles.card} ${styles.cardHighlight}`}>
                {isReady && !isPro && showUpgrade ? (
                  <span className={styles.popularPill}>Most popular</span>
                ) : null}
                <div className={styles.planTop}>
                  <div className={styles.planTopLeft}>
                    <span className={styles.planTag}>Pro</span>
                    {plan === 'PRO' ? (
                      <span className={styles.currentPill} data-testid="billing-current-plan">
                        {currentPlanLabel}
                      </span>
                    ) : null}
                  </div>
                  {plan === 'PRO' && statusPillLabel ? (
                    <span className={styles.statusPill} data-testid="billing-status">
                      {statusPillLabel}
                    </span>
                  ) : null}
                </div>
                <div className={styles.planGrid}>
                  <div className={styles.planSummary}>
                    <div className={styles.planTitle}>Unlimited</div>
                    <div className={styles.planPrice}>
                      <span className={styles.planPriceValue}>$29</span>
                      <span className={styles.planPriceUnit}>/ month (test)</span>
                    </div>
                    <p className={styles.planDesc}>Unlimited usage for growing stores.</p>
                    <span className={styles.planNote}>Stripe is running in test mode.</span>
                    {showProActive ? (
                      <div className={styles.activeNote} data-testid="billing-pro-active">
                        You&apos;re on Pro
                      </div>
                    ) : null}
                  </div>
                  <div className={styles.planIncludes}>
                    <div className={styles.includesTitle}>Included</div>
                    <ul className={styles.featureList}>
                      {PRO_FEATURES.map((item) => (
                        <li key={item} className={styles.featureItem}>
                          {item}
                        </li>
                      ))}
                    </ul>
                    {canShowActions && showUpgrade ? (
                      <Button
                        type="button"
                        size="lg"
                        onClick={() => void onUpgrade()}
                        disabled={submitting}
                        className={styles.upgradeButton}
                        data-testid="billing-upgrade"
                      >
                        {submitting ? 'Starting checkout...' : upgradeLabel}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
