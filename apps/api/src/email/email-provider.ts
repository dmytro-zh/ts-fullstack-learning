/* istanbul ignore file */

export type OrderReceiptEmail = {
  to: string;
  orderId: string;
  customerName: string;
  productName: string;
  quantity: number;
  total: number;
  storeName?: string | null;
  receiptUrl?: string | null;
  shippingAddress?: string | null;
};

export type MerchantNewOrderEmail = {
  to: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  quantity: number;
  total: number;
  storeName?: string | null;
  shippingAddress?: string | null;
  shippingNote?: string | null;
};

export interface EmailProvider {
  sendOrderReceipt(input: OrderReceiptEmail): Promise<void>;
  sendMerchantNewOrder(input: MerchantNewOrderEmail): Promise<void>;
}
