// Public checkout page: load checkout link by slug and render product info + checkout form.
import { createWebGraphQLClient } from '../../../lib/graphql-client';
import {
  CheckoutLinkDocument,
  type CheckoutLinkQuery,
  type CheckoutLinkQueryVariables,
} from '../../../graphql/generated/graphql';
import { CheckoutLinkView } from './CheckoutLinkView';

function isCheckoutLinkNotFound(err: unknown): boolean {
  const anyErr = err as {
    response?: { errors?: Array<{ extensions?: { code?: string } }> };
  };
  return (
    anyErr?.response?.errors?.some(
      (error) => error.extensions?.code === 'CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE',
    ) ?? false
  );
}

async function fetchCheckoutLink(slug: string) {
  const client = await createWebGraphQLClient();
  try {
    const data = await client.request<CheckoutLinkQuery, CheckoutLinkQueryVariables>(
      CheckoutLinkDocument,
      { slug },
    );
    return data.checkoutLink;
  } catch (err) {
    if (isCheckoutLinkNotFound(err)) return null;
    throw err;
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicCheckoutPage({ params }: PageProps) {
  const { slug } = await params;
  const link = await fetchCheckoutLink(slug);

  if (!link || !link.active) {
    return (
      <main style={{ padding: 32, minHeight: '100vh', background: '#f7f7f8', color: '#111827' }}>
        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
          }}
          data-testid="checkout-empty-state"
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Checkout unavailable</h1>
          <p style={{ marginTop: 12 }}>
            This checkout link is no longer active. Please contact the merchant for an updated link.
          </p>
        </div>
      </main>
    );
  }

  if (link.store?.isActive === false) {
    return (
      <main style={{ padding: 32, minHeight: '100vh', background: '#f7f7f8', color: '#111827' }}>
        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            background: '#fff',
            border: '1px solid #fee2e2',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
          }}
          data-testid="checkout-store-blocked"
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            Store temporarily unavailable
          </h1>
          <p style={{ marginTop: 12 }}>
            This store is currently disabled, so checkout links are not available. Please reach out
            to the merchant for assistance.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 32, minHeight: '100vh', background: '#f7f7f8' }}>
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          display: 'grid',
          gap: 16,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
          color: '#111827',
        }}
        data-testid="checkout-page"
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Checkout</h1>
        <CheckoutLinkView link={link} />
      </div>
    </main>
  );
}
