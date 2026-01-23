'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import styles from './page.module.css';

const PASSWORD_HINT = '12+ chars, upper/lower, number, symbol, no spaces.';

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const callbackUrl = useMemo(() => {
    const fromQuery = searchParams.get('callbackUrl');
    return fromQuery && fromQuery.startsWith('/') ? fromQuery : '/dashboard';
  }, [searchParams]);

  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit =
    Boolean(inviteCode.trim()) &&
    Boolean(email.trim()) &&
    Boolean(password) &&
    passwordsMatch &&
    !submitting;

  const onSubmit = async () => {
    setErrorText(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/register-merchant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          email,
          password,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 403) {
          setErrorText('Invalid invite code.');
        } else if (res.status === 409) {
          setErrorText('Email is already registered.');
        } else if (res.status === 400) {
          setErrorText('Please check your email and password.');
        } else {
          setErrorText(`Registration failed: ${text}`);
        }
        return;
      }

      window.location.href = callbackUrl;
    } catch {
      setErrorText('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page} data-testid="register-page">
      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Merchant access
          </div>

          <Text as="h1" variant="title" className={styles.heading}>
            Create a merchant account.
          </Text>
          <Text as="p" variant="muted" className={styles.subheading}>
            Invite code required. Starts on the Free plan.
          </Text>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Merchant account</div>
            <div className={styles.cardNote}>Invite code required.</div>
          </div>

          <div className={styles.form}>
            <label className={styles.label}>
              <span className={styles.labelText}>Invite code</span>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Invite code"
                size="lg"
                data-testid="register-invite"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSubmit();
                }}
              />
            </label>

            <label className={styles.label}>
              <span className={styles.labelText}>Email</span>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                size="lg"
                data-testid="register-email"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSubmit();
                }}
              />
            </label>

            <label className={styles.label}>
              <span className={styles.labelText}>Password</span>
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                size="lg"
                data-testid="register-password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSubmit();
                }}
              />
            </label>

            <label className={styles.label}>
              <span className={styles.labelText}>Confirm password</span>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                size="lg"
                data-testid="register-confirm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSubmit();
                }}
              />
            </label>
          </div>

          <div className={styles.rules}>
            <div className={styles.rulesTitle}>Password rules</div>
            <div>{PASSWORD_HINT}</div>
          </div>

          {confirm.length > 0 && !passwordsMatch ? (
            <div role="status" className={styles.error}>
              Passwords do not match.
            </div>
          ) : null}

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
              data-testid="register-submit"
            >
              {submitting ? 'Creating merchant...' : 'Create merchant account'}
            </Button>

            <div className={styles.footer}>
              Already have an account?{' '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => router.push('/login')}
                data-testid="register-login-link"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
