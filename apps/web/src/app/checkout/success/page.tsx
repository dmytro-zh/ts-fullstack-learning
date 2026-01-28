import { redirect } from 'next/navigation';

type PageProps = {
  searchParams?: Promise<{ session_id?: string }>;
};

async function fetchCheckoutSession(sessionId: string) {
  const baseUrl = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/+$/g, '');
  const res = await fetch(`${baseUrl}/checkout/session/${encodeURIComponent(sessionId)}`, {
    cache: 'no-store',
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    data = {};
  }

  return { status: res.status, data };
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const sessionId = resolvedSearch?.session_id;

  if (!sessionId) {
    return (
      <main
        style={{
          minHeight: '100vh',
          padding: 40,
          background: '#f7f7f8',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#0f172a',
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: 24,
            borderRadius: 20,
            maxWidth: 720,
            width: '100%',
            border: '1px solid #e5e7eb',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
          }}
        >
          Missing checkout session id.
        </div>
      </main>
    );
  }

  const { status, data } = await fetchCheckoutSession(sessionId);

  if (status === 200) {
    const orderId = typeof data.orderId === 'string' ? data.orderId : null;
    const receiptToken = typeof data.receiptToken === 'string' ? data.receiptToken : null;
    if (orderId && receiptToken) {
      redirect(`/thank-you/${orderId}?token=${encodeURIComponent(receiptToken)}`);
    }
  }

  const message =
    status === 202
      ? 'Payment received. We are confirming your order...'
      : status === 409
        ? 'Payment failed. Please try again.'
        : 'Unable to confirm payment. Please contact support.';

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 40,
        background: '#f7f7f8',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: 24,
          borderRadius: 20,
          maxWidth: 720,
          width: '100%',
          border: '1px solid #e5e7eb',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
        }}
      >
        {message}
      </div>
    </main>
  );
}
