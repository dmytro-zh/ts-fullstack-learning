'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import styles from './page.module.css';

type MeResponse = {
  userId: string | null;
  role: string | null;
};

async function hasApiSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/me', {
      cache: 'no-store',
      credentials: 'include',
    });

    if (!res.ok) return false;

    const data = (await res.json()) as MeResponse;
    return Boolean(data.userId) && Boolean(data.role);
  } catch {
    return false;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const callbackUrl = useMemo(() => {
    const fromQuery = searchParams.get('callbackUrl');
    return fromQuery && fromQuery.startsWith('/') ? fromQuery : '/dashboard';
  }, [searchParams]);

  const registerUrl = useMemo(() => {
    return `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }, [callbackUrl]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const ok = await hasApiSession();
      if (!cancelled && ok) {
        router.replace(callbackUrl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, callbackUrl]);

  const onSubmit = async () => {
    setErrorText(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        setErrorText('Invalid email or password.');
        return;
      }

      window.location.href = callbackUrl;
    } catch {
      setErrorText('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(email.trim()) && Boolean(password) && !submitting;

  const fillMerchant = () => {
    setEmail('merchant@local.dev');
    setPassword('Merchant!2025');
  };

  const fillOwner = () => {
    setEmail('owner@local.dev');
    setPassword('Owner!2025Secure');
  };

  return (
    <main className={styles.page} data-testid="login-page">
      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Sign in
          </div>

          <Text as="h1" variant="title" className={styles.heading}>
            Welcome back.
          </Text>
          <Text as="p" variant="muted" className={styles.subheading}>
            Use your merchant or platform owner credentials to access dashboard tools.
          </Text>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Sign in</div>
            <div className={styles.cardNote}>
              You will be redirected to: <span className={styles.noteHighlight}>{callbackUrl}</span>
            </div>
          </div>

          <div className={styles.form}>
            <label className={styles.label}>
              <span className={styles.labelText}>Email</span>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                size="lg"
                data-testid="login-email"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSubmit();
                }}
              />
            </label>

            <label className={styles.label}>
              <span className={styles.labelText}>Password</span>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                size="lg"
                data-testid="login-password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSubmit();
                }}
              />
            </label>
          </div>

          {errorText ? (
            <div role="status" className={styles.error}>
              {errorText}
            </div>
          ) : null}

          <div className={styles.actions}>
            <Button
              type="button"
              size="lg"
              disabled={!canSubmit}
              onClick={() => void onSubmit()}
              data-testid="login-submit"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className={styles.footer}>
              New here?{' '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => router.push(registerUrl)}
                data-testid="login-register-link"
              >
                Create account
              </button>
            </div>

            <div className={styles.shortcuts}>
              <div className={styles.shortcutsLabel}>Dev shortcuts:</div>

              <div className={styles.shortcutsButtons}>
                <Button type="button" variant="ghost" size="sm" onClick={fillMerchant}>
                  Continue as Merchant
                </Button>

                <Button type="button" variant="ghost" size="sm" onClick={fillOwner}>
                  Continue as Owner
                </Button>
              </div>
            </div>

            <div className={styles.demoBox}>
              <div className={styles.demoTitle}>Demo users</div>
              <div>merchant@local.dev / Merchant!2025</div>
              <div>owner@local.dev / Owner!2025Secure</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
