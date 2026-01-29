import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma', () => {
  return {
    prisma: {
      order: {
        findUnique: vi.fn(),
      },
      store: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock('../auth/receipt-token', () => {
  return {
    issueReceiptToken: vi.fn(),
  };
});

import { issueReceiptToken } from '../auth/receipt-token';
import { prisma } from '../lib/prisma';
import { EmailService } from './email.service';

const prismaOrder = prisma.order as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
};
const prismaStore = prisma.store as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
};
const prismaUser = prisma.user as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
};

function createProviderMock() {
  return {
    sendOrderReceipt: vi.fn(),
    sendMerchantNewOrder: vi.fn(),
  };
}

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when order is missing', async () => {
    prismaOrder.findUnique.mockResolvedValueOnce(null);

    const provider = createProviderMock();
    const service = new EmailService(provider);

    await service.sendOrderPaidEmails('order_1');

    expect(provider.sendOrderReceipt).not.toHaveBeenCalled();
    expect(provider.sendMerchantNewOrder).not.toHaveBeenCalled();
  });

  it('does nothing when order is not paid', async () => {
    prismaOrder.findUnique.mockResolvedValueOnce({
      id: 'order_2',
      status: 'PENDING_PAYMENT',
      storeId: null,
      product: { name: 'Widget' },
      customerName: 'Alex',
      email: 'alex@test.dev',
      quantity: 1,
      total: 10,
      shippingAddress: null,
      shippingNote: null,
    });

    const provider = createProviderMock();
    const service = new EmailService(provider);

    await service.sendOrderPaidEmails('order_2');

    expect(provider.sendOrderReceipt).not.toHaveBeenCalled();
    expect(provider.sendMerchantNewOrder).not.toHaveBeenCalled();
  });

  it('sends receipt and merchant email for paid order', async () => {
    prismaOrder.findUnique.mockResolvedValueOnce({
      id: 'order_3',
      status: 'PAID',
      storeId: 'store_1',
      product: { name: 'Widget' },
      customerName: 'Alex',
      email: 'alex@test.dev',
      quantity: 2,
      total: 20,
      shippingAddress: '123 Main St',
      shippingNote: 'Leave at door',
    });
    prismaStore.findUnique.mockResolvedValueOnce({
      id: 'store_1',
      name: 'Cool Store',
      email: 'merchant@test.dev',
      ownerId: 'owner_1',
    });
    (issueReceiptToken as ReturnType<typeof vi.fn>).mockResolvedValueOnce('token123');

    const provider = createProviderMock();
    const service = new EmailService(provider);

    await service.sendOrderPaidEmails('order_3');

    expect(provider.sendOrderReceipt).toHaveBeenCalledWith({
      to: 'alex@test.dev',
      orderId: 'order_3',
      customerName: 'Alex',
      productName: 'Widget',
      quantity: 2,
      total: 20,
      storeName: 'Cool Store',
      receiptUrl: 'http://localhost:3000/thank-you/order_3?token=token123',
      shippingAddress: '123 Main St',
    });

    expect(provider.sendMerchantNewOrder).toHaveBeenCalledWith({
      to: 'merchant@test.dev',
      orderId: 'order_3',
      customerName: 'Alex',
      customerEmail: 'alex@test.dev',
      productName: 'Widget',
      quantity: 2,
      total: 20,
      storeName: 'Cool Store',
      shippingAddress: '123 Main St',
      shippingNote: 'Leave at door',
    });
  });

  it('falls back to owner email when store email is missing', async () => {
    prismaOrder.findUnique.mockResolvedValueOnce({
      id: 'order_4',
      status: 'PAID',
      storeId: 'store_2',
      product: { name: 'Widget' },
      customerName: 'Alex',
      email: 'alex@test.dev',
      quantity: 1,
      total: 10,
      shippingAddress: null,
      shippingNote: null,
    });
    prismaStore.findUnique.mockResolvedValueOnce({
      id: 'store_2',
      name: 'No Email Store',
      email: null,
      ownerId: 'owner_2',
    });
    prismaUser.findUnique.mockResolvedValueOnce({ email: 'owner@test.dev' });
    (issueReceiptToken as ReturnType<typeof vi.fn>).mockResolvedValueOnce('token123');

    const provider = createProviderMock();
    const service = new EmailService(provider);

    await service.sendOrderPaidEmails('order_4');

    expect(provider.sendMerchantNewOrder).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'owner@test.dev' }),
    );
  });

  it('handles receipt token errors gracefully', async () => {
    prismaOrder.findUnique.mockResolvedValueOnce({
      id: 'order_5',
      status: 'PAID',
      storeId: null,
      product: { name: 'Widget' },
      customerName: 'Alex',
      email: 'alex@test.dev',
      quantity: 1,
      total: 10,
      shippingAddress: null,
      shippingNote: null,
    });
    (issueReceiptToken as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('fail'));

    const provider = createProviderMock();
    const service = new EmailService(provider);

    await service.sendOrderPaidEmails('order_5');

    expect(provider.sendOrderReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ receiptUrl: null }),
    );
  });

  it('logs and continues when provider fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaOrder.findUnique.mockResolvedValueOnce({
      id: 'order_6',
      status: 'PAID',
      storeId: null,
      product: { name: 'Widget' },
      customerName: 'Alex',
      email: 'alex@test.dev',
      quantity: 1,
      total: 10,
      shippingAddress: null,
      shippingNote: null,
    });
    (issueReceiptToken as ReturnType<typeof vi.fn>).mockResolvedValueOnce('token123');

    const provider = createProviderMock();
    provider.sendOrderReceipt.mockRejectedValueOnce(new Error('fail'));

    const service = new EmailService(provider);
    await service.sendOrderPaidEmails('order_6');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
