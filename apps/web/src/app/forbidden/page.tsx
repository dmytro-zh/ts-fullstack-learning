import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main
      style={{
        padding: '40px 16px 56px',
        minHeight: 'calc(100vh - 80px)',
        boxSizing: 'border-box',
        color: '#020617',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 12 }}>
        <div
          style={{
            borderRadius: 18,
            border: '1px solid rgba(226,232,240,0.95)',
            background: '#ffffff',
            boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
            padding: 18,
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>Access denied</div>
          <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700, lineHeight: 1.5 }}>
            Your account does not have permission to view this page.
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
            <Link
              href="/"
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: '1px solid rgba(226,232,240,0.95)',
                background: '#ffffff',
                color: '#0f172a',
                fontWeight: 900,
                textDecoration: 'none',
                boxShadow: '0 8px 22px rgba(15,23,42,0.06)',
                lineHeight: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              Go home
            </Link>

            <Link
              href="/login"
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: '1px solid #1d4ed8',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 900,
                textDecoration: 'none',
                boxShadow: '0 12px 26px rgba(37,99,235,0.22)',
                lineHeight: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
