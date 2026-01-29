import { describe, expect, it, vi } from 'vitest';
import { ConsoleEmailProvider } from './console-email-provider';

describe('ConsoleEmailProvider', () => {
  it('logs receipt email payload', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const provider = new ConsoleEmailProvider();

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

    expect(spy).toHaveBeenCalledWith('[email:receipt]', expect.any(Object));
    spy.mockRestore();
  });

  it('logs merchant new order payload', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const provider = new ConsoleEmailProvider();

    await provider.sendMerchantNewOrder({
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
    });

    expect(spy).toHaveBeenCalledWith('[email:merchant-new-order]', expect.any(Object));
    spy.mockRestore();
  });
});
