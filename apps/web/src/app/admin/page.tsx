import Link from 'next/link';

export default function AdminPage() {
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
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gap: 18,
        }}
      >
        <section style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Admin</div>
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: -0.03 }}>
            Platform owner area
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
            This is a placeholder admin zone. Next steps will add real owner tools.
          </p>
        </section>

        <section
          style={{
            borderRadius: 20,
            border: '1px solid rgba(209,213,219,0.9)',
            background: '#ffffff',
            padding: 16,
            display: 'grid',
            gap: 10,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              border: '1px solid rgba(226,232,240,0.95)',
              background: 'rgba(248,250,252,0.9)',
              padding: 14,
              display: 'grid',
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 14 }}>Planned owner tools</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#475569', fontSize: 13, lineHeight: 1.7 }}>
              <li>Manage merchants and stores</li>
              <li>View platform-wide metrics</li>
              <li>Audit checkout links and orders</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
            <Link
              href="/dashboard"
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: '1px solid #1d4ed8',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 12px 26px rgba(37,99,235,0.22)',
                lineHeight: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              Go to dashboard
            </Link>

            <Link
              href="/"
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: '1px solid rgba(226,232,240,0.95)',
                background: '#ffffff',
                color: '#0f172a',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 8px 22px rgba(15,23,42,0.06)',
                lineHeight: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              Back home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
