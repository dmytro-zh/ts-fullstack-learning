'use client';

import { useState, useTransition } from 'react';
import type { OrdersByStoreQuery } from '../../graphql/generated/graphql';
import { OrderStatus } from '../../graphql/generated/graphql';
import { updateOrderStatusAction } from '../actions/updateOrderStatus';

type Order = OrdersByStoreQuery['orders'][number];
type OrderStatusEnum = OrderStatus;

type OrdersListProps = {
  initialOrders: Order[];
};

const STATUS_LABELS: Record<OrderStatusEnum, string> = {
  [OrderStatus.New]: 'New',
  [OrderStatus.Pending]: 'Pending',
  [OrderStatus.PendingPayment]: 'Pending payment',
  [OrderStatus.Paid]: 'Paid',
  [OrderStatus.Failed]: 'Failed',
  [OrderStatus.Processing]: 'Processing',
  [OrderStatus.Shipped]: 'Shipped',
  [OrderStatus.Completed]: 'Completed',
  [OrderStatus.Cancelled]: 'Cancelled',
  [OrderStatus.Refunded]: 'Refunded',
};

const STATUS_OPTIONS: OrderStatusEnum[] = [
  OrderStatus.New,
  OrderStatus.Pending,
  OrderStatus.PendingPayment,
  OrderStatus.Paid,
  OrderStatus.Failed,
  OrderStatus.Processing,
  OrderStatus.Shipped,
  OrderStatus.Completed,
  OrderStatus.Cancelled,
  OrderStatus.Refunded,
];

function statusColors(status: OrderStatusEnum): { bg: string; text: string } {
  switch (status) {
    case OrderStatus.New:
      return { bg: '#eff6ff', text: '#1d4ed8' };
    case OrderStatus.Pending:
      return { bg: '#fef9c3', text: '#92400e' };
    case OrderStatus.PendingPayment:
      return { bg: '#fef9c3', text: '#92400e' };
    case OrderStatus.Paid:
      return { bg: '#dcfce7', text: '#166534' };
    case OrderStatus.Failed:
      return { bg: '#fee2e2', text: '#b91c1c' };
    case OrderStatus.Processing:
      return { bg: '#e0f2fe', text: '#0369a1' };
    case OrderStatus.Shipped:
      return { bg: '#ede9fe', text: '#5b21b6' };
    case OrderStatus.Completed:
      return { bg: '#ecfdf3', text: '#15803d' };
    case OrderStatus.Cancelled:
      return { bg: '#fee2e2', text: '#b91c1c' };
    case OrderStatus.Refunded:
      return { bg: '#f1f5f9', text: '#0f172a' };
    default:
      return { bg: '#e5e7eb', text: '#374151' };
  }
}

export function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = (orderId: string, nextStatus: OrderStatusEnum) => {
    setError(null);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: nextStatus,
            }
          : o,
      ),
    );

    startTransition(async () => {
      try {
        await updateOrderStatusAction({ orderId, status: nextStatus });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update order status');
      }
    });
  };

  if (orders.length === 0) {
    return (
      <p style={{ marginTop: 8 }} data-testid="orders-empty">
        No orders yet for this store.
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {error && (
        <p style={{ margin: 0, color: '#b91c1c', fontSize: 13 }} data-testid="orders-error">
          {error}
        </p>
      )}

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gap: 12,
        }}
        data-testid="orders-list"
      >
        {orders.map((o) => {
          const currentStatus = o.status ?? OrderStatus.New;
          const colors = statusColors(currentStatus);
          const createdAt = new Date(o.createdAt).toLocaleString();
          const quantity = o.quantity ?? 1;

          return (
            <li
              key={o.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 16,
                background: '#fff',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
                display: 'grid',
                gap: 8,
              }}
              data-testid="orders-item"
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 12,
                }}
              >
                <div style={{ display: 'grid', gap: 4 }}>
                  <strong style={{ color: '#111827' }}>
                    {o.product?.name ?? 'Unknown product'} × {quantity}
                  </strong>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{createdAt}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: colors.bg,
                      color: colors.text,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {STATUS_LABELS[currentStatus]}
                  </span>

                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatusEnum)}
                    disabled={isPending}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid #d1d5db',
                      background: '#f9fafb',
                      fontSize: 12,
                      color: '#374151',
                      cursor: isPending ? 'wait' : 'pointer',
                    }}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ color: '#0f172a' }}>
                Total: ${o.total.toFixed(2)}
                {o.checkoutLink?.slug ? ` · Link: /c/${o.checkoutLink.slug}` : ''}
              </div>

              <div style={{ color: '#111827' }}>
                Buyer: {o.customerName} ({o.email})
              </div>

              {o.shippingNote ? (
                <div style={{ color: '#334155' }}>Note: {o.shippingNote}</div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {isPending && (
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Saving status changes...</p>
      )}
    </div>
  );
}
