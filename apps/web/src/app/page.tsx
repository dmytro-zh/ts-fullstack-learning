import Link from 'next/link';
import { HomeFlowPanel } from './_components/HomeFlowPanel';

export default async function Home() {
  return (
    <section
      style={{
        padding: '40px 16px 56px',
        minHeight: 'calc(100vh - 80px)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gap: 32,
        }}
      >
        <section
          style={{
            display: 'grid',
            gap: 18,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 12px',
              borderRadius: 999,
              border: '1px dashed rgba(148,163,184,0.7)',
              background: 'rgba(240,249,255,0.9)',
              margin: '0 auto',
              fontSize: 11,
              color: '#6b7280',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background:
                  'radial-gradient(circle at 30% 30%, #22c55e 0, #16a34a 50%, #0f766e 100%)',
              }}
            />
            Checkout links for tiny shops
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 38,
                lineHeight: 1.08,
                letterSpacing: -0.04,
                color: '#020617',
              }}
            >
              Sell one thing well.
              <br />
              Let the link do the talking.
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 15,
                lineHeight: 1.7,
                maxWidth: 640,
                marginInline: 'auto',
                color: '#4b5563',
              }}
            >
              Creator checkout is a small control room for people who sell a handful of things:
              prints, sessions, classes, handmade goods. No theme setup, no storefront to babysit.
              Just a product, a checkout link, and clear orders.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 6,
            }}
          >
            <Link
              href="/dashboard"
              style={{
                padding: '11px 20px',
                borderRadius: 999,
                border: '1px solid #020617',
                background: 'linear-gradient(135deg, #020617 0, #0f172a 40%, #020617 100%)',
                color: '#ecfeff',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
              data-testid="home-open-dashboard"
            >
              Open dashboard
            </Link>
            <Link
              href="/products"
              style={{
                padding: '11px 18px',
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.7)',
                background: 'rgba(248,250,252,0.9)',
                color: '#020617',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
              data-testid="home-add-product"
            >
              Add a product
            </Link>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: '#64748b',
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <span>No landing page builder</span>
            <span aria-hidden="true">·</span>
            <span>No design homework</span>
            <span aria-hidden="true">·</span>
            <span>Just checkout links that work</span>
          </p>
        </section>

        <HomeFlowPanel />
      </div>
    </section>
  );
}
