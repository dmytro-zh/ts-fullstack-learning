import ThankYouAnimation from './ThankYouAnimation';
import { createWebGraphQLClient } from '../../../lib/graphql-client';

const ORDER_QUERY = /* GraphQL */ `
  query OrderReceipt($orderId: ID!, $token: String!) {
    orderReceipt(orderId: $orderId, token: $token) {
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
  orderReceipt: {
    id: string;
    total: number;
    quantity: number;
    email: string;
    customerName: string;
    shippingAddress: string;
    product: { name: string };
  };
};

async function fetchOrder(id: string, token: string) {
  const client = await createWebGraphQLClient();
  const data = await client.request<OrderResponse>(ORDER_QUERY, { orderId: id, token });
  return data.orderReceipt;
}

type ThankYouPageProps = {
  params?: Promise<{ orderId: string }>;
  searchParams?: Promise<{ token?: string }>;
};

export default async function ThankYouPage({ params, searchParams }: ThankYouPageProps) {
  const resolvedParams = params ? await params : undefined;
  const orderId = resolvedParams?.orderId;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const token = resolvedSearch?.token;

  if (!orderId) {
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
          Missing order id.
        </div>
      </main>
    );
  }

  if (!token) {
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
          Missing receipt token.
        </div>
      </main>
    );
  }

  let order: OrderResponse['orderReceipt'] | null = null;
  try {
    order = await fetchOrder(orderId, token);
  } catch {
    order = null;
  }

  if (!order) {
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
          Order not found or receipt expired.
        </div>
      </main>
    );
  }

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
