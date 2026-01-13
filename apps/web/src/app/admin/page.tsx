import Link from 'next/link';

const cardBorder = '1px solid rgba(148,163,184,0.35)';

export default function AdminPage() {
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
          maxWidth: 980,
          display: 'grid',
          gap: 14,
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px dashed rgba(148,163,184,0.7)',
              background: 'rgba(240,249,255,0.9)',
              width: 'fit-content',
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
            Admin zone
          </div>

          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: -0.03 }}>
            Platform owner dashboard
          </h1>

          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
            This area is restricted to PLATFORM_OWNER. Later we will add store onboarding, merchant
            management, and internal controls here.
          </p>
        </div>

        <div
          style={{
            borderRadius: 22,
            border: cardBorder,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))',
            boxShadow: '0 18px 55px rgba(15,23,42,0.12), 0 0 0 1px rgba(148,163,184,0.10)',
            padding: 18,
            display: 'grid',
            gap: 14,
            backdropFilter: 'blur(18px)',
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
          >
            <div style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: -0.01 }}>
                Owner actions
              </div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                Quick links and placeholders for the future admin features.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                href="/"
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.45)',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#0f172a',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: '0 10px 22px rgba(15,23,42,0.08)',
                  whiteSpace: 'nowrap',
                }}
              >
                Home
              </Link>

              <Link
                href="/dashboard"
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.45)',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#0f172a',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: '0 10px 22px rgba(15,23,42,0.08)',
                  whiteSpace: 'nowrap',
                }}
              >
                Merchant dashboard
              </Link>

              <Link
                href="/checkout-links"
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(37,99,235,0.9)',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#f9fafb',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: '0 12px 26px rgba(37,99,235,0.22)',
                  whiteSpace: 'nowrap',
                }}
              >
                Checkout links
              </Link>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <div
              style={{
                borderRadius: 18,
                border: '1px solid rgba(148,163,184,0.28)',
                background: 'rgba(248,250,252,0.85)',
                padding: 14,
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 12, color: '#0f172a' }}>Merchants</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                Create and manage merchant accounts. (Next PRs)
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Placeholder</div>
            </div>

            <div
              style={{
                borderRadius: 18,
                border: '1px solid rgba(148,163,184,0.28)',
                background: 'rgba(248,250,252,0.85)',
                padding: 14,
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 12, color: '#0f172a' }}>Stores</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                Review stores, owners, and health checks. (Next PRs)
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Placeholder</div>
            </div>

            <div
              style={{
                borderRadius: 18,
                border: '1px solid rgba(148,163,184,0.28)',
                background: 'rgba(248,250,252,0.85)',
                padding: 14,
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 12, color: '#0f172a' }}>Audit</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                Admin actions log, role changes, and auth diagnostics. (Next PRs)
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Placeholder</div>
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
            <div style={{ color: '#0f172a', fontWeight: 800, marginBottom: 4 }}>Guard behavior</div>
            <div>- Not signed in =&gt; redirect to /login</div>
            <div>- Signed in as MERCHANT =&gt; redirect to /forbidden</div>
            <div>- Signed in as PLATFORM_OWNER =&gt; allowed</div>
          </div>
        </div>
      </div>
    </main>
  );
}
