import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResendEmailProvider } from './resend-email-provider';

describe('ResendEmailProvider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as typeof globalThis & { fetch: typeof fetchMock }).fetch = fetchMock;
  });

  it('sends receipt email via Resend API', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '' });

    const provider = new ResendEmailProvider({
      apiKey: 'rk_test',
      from: 'Demo <demo@example.com>',
      replyTo: null,
    });

    await provider.sendOrderReceipt({
      to: 'buyer@test.dev',
      orderId: 'order_1',
      customerName: 'Alex',
      productName: 'Widget',
      quantity: 1,
      total: 9.99,
      storeName: 'Demo',
      receiptUrl: null,
      shippingAddress: null,
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.any(Object));
  });

  it('throws when Resend API fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'bad' });

    const provider = new ResendEmailProvider({
      apiKey: 'rk_test',
      from: 'Demo <demo@example.com>',
      replyTo: null,
    });

    await expect(
      provider.sendMerchantNewOrder({
        to: 'merchant@test.dev',
        orderId: 'order_2',
        customerName: 'Alex',
        customerEmail: 'buyer@test.dev',
        productName: 'Widget',
        quantity: 2,
        total: 19.98,
        storeName: 'Demo',
        shippingAddress: 'Street 1',
        shippingNote: 'Leave at door',
      }),
    ).rejects.toThrow('Resend email failed');
  });
});
