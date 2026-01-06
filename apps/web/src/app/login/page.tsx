'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const cardBorder = '1px solid rgba(148,163,184,0.35)';

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

  const canSubmit = Boolean(email.trim()) && Boolean(password) && !submitting;

  const fillMerchant = () => {
    setEmail('merchant@local.dev');
    setPassword('merchant');
  };

  const fillOwner = () => {
    setEmail('owner@local.dev');
    setPassword('owner');
  };

  return (
    <main
      style={{
        padding: '44px 16px 56px',
        minHeight: 'calc(100vh - 80px)',
        boxSizing: 'border-box',
        color: '#020617',
        display: 'grid',
        placeItems: 'start center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          display: 'grid',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: 10,
            textAlign: 'center',
            paddingTop: 6,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px 12px',
              borderRadius: 999,
              border: '1px dashed rgba(148,163,184,0.7)',
              background: 'rgba(240,249,255,0.9)',
              margin: '0 auto',
              fontSize: 11,
              color: '#6b7280',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background:
                  'radial-gradient(circle at 30% 30%, #22c55e 0, #16a34a 50%, #0f766e 100%)',
              }}
            />
            Merchant sign in
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 26,
              letterSpacing: -0.03,
            }}
          >
            Welcome back.
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#6b7280',
              lineHeight: 1.6,
            }}
          >
            Use your merchant or platform owner credentials to access dashboard tools.
          </p>
        </div>

        <div
          style={{
            borderRadius: 22,
            border: cardBorder,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))',
            boxShadow:
              '0 18px 55px rgba(15,23,42,0.12), 0 0 0 1px rgba(148,163,184,0.10)',
            padding: 18,
            display: 'grid',
            gap: 14,
            backdropFilter: 'blur(18px)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 6,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: -0.01,
              }}
            >
              Sign in
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                lineHeight: 1.5,
              }}
            >
              You will be redirected to: <span style={{ color: '#0f172a', fontWeight: 700 }}>{callbackUrl}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 12, color: '#0f172a' }}>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSubmit();
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.45)',
                  background: 'rgba(248,250,252,0.9)',
                  color: '#0f172a',
                  fontSize: 14,
                  lineHeight: 1.4,
                  outline: 'none',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 12, color: '#0f172a' }}>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSubmit();
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.45)',
                  background: 'rgba(248,250,252,0.9)',
                  color: '#0f172a',
                  fontSize: 14,
                  lineHeight: 1.4,
                  outline: 'none',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              />
            </label>
          </div>

          {errorText ? (
            <div
              role="status"
              style={{
                borderRadius: 16,
                border: '1px solid rgba(248,113,113,0.35)',
                background: 'rgba(254,242,242,0.9)',
                color: '#991b1b',
                padding: '10px 12px',
                fontWeight: 800,
                fontSize: 12,
                lineHeight: 1.35,
              }}
            >
              {errorText}
            </div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gap: 10,
            }}
          >
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => void onSubmit()}
              style={{
                padding: '11px 16px',
                borderRadius: 999,
                border: '1px solid rgba(37,99,235,0.9)',
                background: !canSubmit
                  ? 'linear-gradient(135deg, rgba(147,197,253,0.95), rgba(147,197,253,0.70))'
                  : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#f9fafb',
                fontWeight: 800,
                cursor: !canSubmit ? 'not-allowed' : 'pointer',
                boxShadow: !canSubmit ? 'none' : '0 14px 30px rgba(37,99,235,0.28)',
                lineHeight: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  fontWeight: 700,
                }}
              >
                Dev shortcuts:
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={fillMerchant}
                  style={{
                    padding: '7px 11px',
                    borderRadius: 999,
                    border: '1px solid rgba(148,163,184,0.55)',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#111827',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Continue as Merchant
                </button>

                <button
                  type="button"
                  onClick={fillOwner}
                  style={{
                    padding: '7px 11px',
                    borderRadius: 999,
                    border: '1px solid rgba(148,163,184,0.55)',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#111827',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Continue as Owner
                </button>
              </div>
            </div>

            <div
              style={{
                borderRadius: 16,
                border: '1px solid rgba(148,163,184,0.22)',
                background: 'rgba(248,250,252,0.75)',
                padding: '10px 12px',
                fontSize: 11,
                color: '#64748b',
                lineHeight: 1.5,
                fontWeight: 650,
              }}
            >
              <div style={{ color: '#0f172a', fontWeight: 800, marginBottom: 4 }}>
                Demo users
              </div>
              <div>merchant@local.dev / merchant</div>
              <div>owner@local.dev / owner</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
