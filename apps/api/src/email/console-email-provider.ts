import type { EmailProvider, MerchantNewOrderEmail, OrderReceiptEmail } from './email-provider';

export class ConsoleEmailProvider implements EmailProvider {
  async sendOrderReceipt(input: OrderReceiptEmail): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[email:receipt]', {
      to: input.to,
      orderId: input.orderId,
      customerName: input.customerName,
      productName: input.productName,
      quantity: input.quantity,
      total: input.total,
      storeName: input.storeName ?? null,
      receiptUrl: input.receiptUrl ?? null,
    });
  }

  async sendMerchantNewOrder(input: MerchantNewOrderEmail): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[email:merchant-new-order]', {
      to: input.to,
      orderId: input.orderId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      productName: input.productName,
      quantity: input.quantity,
      total: input.total,
      storeName: input.storeName ?? null,
      shippingAddress: input.shippingAddress ?? null,
      shippingNote: input.shippingNote ?? null,
    });
  }
}
