import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { NextAuthSessionProvider } from './_providers/SessionProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Drop the link',
  description: 'Tiny checkout and orders dashboard for small creators',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{
          margin: 0,
          minHeight: '100vh',
          background: 'radial-gradient(circle at top, #e5f2ff 0, #f9fafb 45%, #f3f4f6 100%)',
          color: '#020617',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 20,
              backdropFilter: 'blur(18px)',
              background:
                'linear-gradient(to bottom, rgba(249,250,251,0.88), rgba(249,250,251,0.70), transparent)',
            }}
          >
            <div
              style={{
                maxWidth: 1120,
                margin: '10px auto 0',
                padding: '0 16px 8px',
              }}
            >
              <div
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.35)',
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))',
                  boxShadow: '0 14px 40px rgba(15,23,42,0.12), 0 0 0 1px rgba(148,163,184,0.12)',
                  padding: '9px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <Link
                  href="/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    textDecoration: 'none',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      background:
                        'radial-gradient(circle at 0 0, #38bdf8 0, #6366f1 45%, #0f172a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 10px 24px rgba(37,99,235,0.42), 0 0 0 1px rgba(15,23,42,0.35)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#f9fafb',
                      }}
                    >
                      DL
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      lineHeight: 1.1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#020617',
                      }}
                    >
                      Drop the link
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#17253dff',
                      }}
                    >
                      Tiny links, clear orders.
                    </span>
                  </div>
                </Link>

                <nav
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                  }}
                >
                  <Link
                    href="/products"
                    style={{
                      textDecoration: 'none',
                      padding: '6px 11px',
                      borderRadius: 999,
                      color: '#4b5563',
                      border: '1px solid transparent',
                    }}
                  >
                    Products
                  </Link>
                  <Link
                    href="/stores"
                    style={{
                      textDecoration: 'none',
                      padding: '6px 11px',
                      borderRadius: 999,
                      color: '#4b5563',
                      border: '1px solid transparent',
                    }}
                  >
                    Stores
                  </Link>
                  <Link
                    href="/dashboard"
                    style={{
                      textDecoration: 'none',
                      padding: '6px 11px',
                      borderRadius: 999,
                      color: '#4b5563',
                      border: '1px solid transparent',
                    }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/checkout-links"
                    style={{
                      textDecoration: 'none',
                      padding: '7px 14px',
                      borderRadius: 999,
                      border: '1px solid rgba(37,99,235,0.9)',
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      color: '#f9fafb',
                      fontWeight: 600,
                      boxShadow: '0 10px 26px rgba(37,99,235,0.30)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Checkout links
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          <main
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
          </main>

          <footer
            style={{
              borderTop: '1px solid rgba(148,163,184,0.25)',
              padding: '12px 16px 18px',
              fontSize: 11,
              color: '#9ca3af',
              background: 'linear-gradient(to top, rgba(248,250,252,0.96), rgba(248,250,252,0.75))',
            }}
          >
            <div
              style={{
                maxWidth: 1120,
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Creator checkout · side project</span>
              <span>Built for very small, very real shops.</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
