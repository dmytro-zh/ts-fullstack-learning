'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const callbackUrl = useMemo(() => {
    const fromQuery = searchParams.get('callbackUrl');
    return fromQuery && fromQuery.startsWith('/') ? fromQuery : '/dashboard';
  }, [searchParams]);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const onSubmit = async () => {
    setErrorText(null);
    setSubmitting(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!res || res.error) {
        setErrorText('Invalid email or password.');
        return;
      }

      router.replace(callbackUrl);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      style={{
        padding: '40px 16px 56px',
        minHeight: 'calc(100vh - 80px)',
        boxSizing: 'border-box',
        color: '#020617',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          display: 'grid',
          gap: 14,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            border: '1px solid rgba(226,232,240,0.95)',
            background: '#ffffff',
            boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
            padding: 18,
            display: 'grid',
            gap: 12,
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Sign in</div>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>
              Use your merchant or platform owner credentials.
            </div>
          </div>

          <label style={{ display: 'grid', gap: 6, fontWeight: 900, fontSize: 12 }}>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(226,232,240,0.95)',
                background: '#f8fafc',
                color: '#0f172a',
                fontSize: 14,
                lineHeight: 1.4,
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, fontWeight: 900, fontSize: 12 }}>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(226,232,240,0.95)',
                background: '#f8fafc',
                color: '#0f172a',
                fontSize: 14,
                lineHeight: 1.4,
                outline: 'none',
              }}
            />
          </label>

          {errorText ? (
            <div
              role="status"
              style={{
                borderRadius: 14,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#991b1b',
                padding: '10px 12px',
                fontWeight: 900,
                fontSize: 13,
                lineHeight: 1.35,
              }}
            >
              {errorText}
            </div>
          ) : null}

          <button
            type="button"
            disabled={submitting || !email || !password}
            onClick={() => void onSubmit()}
            style={{
              padding: '10px 14px',
              borderRadius: 999,
              border: '1px solid #1d4ed8',
              background: submitting || !email || !password ? '#93c5fd' : '#2563eb',
              color: '#ffffff',
              fontWeight: 900,
              cursor: submitting || !email || !password ? 'not-allowed' : 'pointer',
              boxShadow: '0 12px 26px rgba(37,99,235,0.22)',
              lineHeight: '20px',
              whiteSpace: 'nowrap',
              marginTop: 4,
            }}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>
            After sign in you will be redirected to: <span style={{ color: '#475569' }}>{callbackUrl}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
