import ThankYouAnimation from './ThankYouAnimation';
import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../../lib/env';

const ORDER_QUERY = /* GraphQL */ `
  query Order($id: ID!) {
    order(id: $id) {
      id
      total
      quantity
      email
      customerName
      product {
        name
      }
      shippingAddress
    }
  }
`;

type OrderResponse = {
  order: {
    id: string;
    total: number;
    quantity: number;
    email: string;
    customerName: string;
    shippingAddress: string;
    product: { name: string };
  };
};

async function fetchOrder(id: string) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const data = await client.request<OrderResponse>(ORDER_QUERY, { id });
  return data.order;
}

type ThankYouPageProps = {
  params: { orderId: string };
};

export default async function ThankYouPage({ params }: ThankYouPageProps) {
  const { orderId } = params;
  const order = await fetchOrder(orderId);

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 40,
        background: '#f7f7f8',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: 32,
          borderRadius: 24,
          maxWidth: 880,
          width: '100%',
          border: '1px solid #e5e7eb',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
          display: 'grid',
          gap: 24,
        }}
      >
        <div
          style={{
            padding: 32,
            borderRadius: 24,
            background:
              'radial-gradient(circle at 50% 20%, #fecaca 0, #fca5a5 30%, #fee2e2 65%, #ffffff 100%)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <ThankYouAnimation />
        </div>

        <h1
          style={{
            textAlign: 'center',
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Thank you for your purchase!
        </h1>

        <p
          style={{
            textAlign: 'center',
            margin: 0,
            color: '#4b5563',
            fontSize: 16,
          }}
        >
          Your order has been placed successfully. A confirmation email was sent to{' '}
          <strong>{order.email}</strong>.
        </p>

        <div
          style={{
            padding: 20,
            borderRadius: 16,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ margin: 0, marginBottom: 8, fontSize: 20, fontWeight: 600 }}>
            Order details
          </h2>
          <p style={{ margin: '4px 0' }}>
            <strong>Order ID:</strong> {order.id}
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>Product:</strong> {order.product.name}
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>Quantity:</strong> {order.quantity}
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>Total:</strong> ${order.total.toFixed(2)}
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>Shipping address:</strong> {order.shippingAddress}
          </p>
        </div>
      </div>
    </main>
  );
}
