// Public checkout page: load checkout link by slug and render product info + checkout form.
import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../../lib/env';
import {
  CheckoutLinkDocument,
  type CheckoutLinkQuery,
  type CheckoutLinkQueryVariables,
} from '../../../graphql/generated/graphql';
import { CheckoutLinkView } from './CheckoutLinkView';

async function fetchCheckoutLink(slug: string) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const data = await client.request<CheckoutLinkQuery, CheckoutLinkQueryVariables>(
    CheckoutLinkDocument,
    { slug },
  );
  return data.checkoutLink;
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
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Checkout link</h1>
          <p style={{ marginTop: 12 }}>Link not found or inactive.</p>
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
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Checkout</h1>
        <CheckoutLinkView link={link} />
      </div>
    </main>
  );
}