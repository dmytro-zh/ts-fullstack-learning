import { issueReceiptToken } from '../auth/receipt-token';
import { prisma } from '../lib/prisma';
import { ConsoleEmailProvider } from './console-email-provider';
import type { EmailProvider } from './email-provider';
import { ResendEmailProvider } from './resend-email-provider';

function getWebBaseUrl() {
  return (process.env.WEB_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/g, '');
}

function selectEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const replyTo = process.env.EMAIL_REPLY_TO ?? null;

  if (apiKey && from) {
    return new ResendEmailProvider({ apiKey, from, replyTo });
  }

  return new ConsoleEmailProvider();
}

export class EmailService {
  constructor(private readonly provider: EmailProvider) {}

  async sendOrderPaidEmails(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
      },
    });

    if (!order || order.status !== 'PAID') return;

    const store = order.storeId
      ? await prisma.store.findUnique({ where: { id: order.storeId } })
      : null;
    const storeName = store?.name ?? null;
    const receiptUrl = await this.buildReceiptUrl(order.id, order.email);

    try {
      await this.provider.sendOrderReceipt({
        to: order.email,
        orderId: order.id,
        customerName: order.customerName,
        productName: order.product.name,
        quantity: order.quantity,
        total: order.total,
        storeName,
        receiptUrl,
        shippingAddress: order.shippingAddress ?? null,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to send receipt email', err);
    }

    const merchantEmail = await this.resolveMerchantEmail(
      store?.ownerId ?? null,
      store?.email ?? null,
    );
    if (!merchantEmail) return;

    try {
      await this.provider.sendMerchantNewOrder({
        to: merchantEmail,
        orderId: order.id,
        customerName: order.customerName,
        customerEmail: order.email,
        productName: order.product.name,
        quantity: order.quantity,
        total: order.total,
        storeName,
        shippingAddress: order.shippingAddress ?? null,
        shippingNote: order.shippingNote ?? null,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to send merchant order email', err);
    }
  }

  private async resolveMerchantEmail(ownerId: string | null, storeEmail: string | null) {
    if (storeEmail) return storeEmail;
    if (!ownerId) return null;

    const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { email: true } });
    return owner?.email ?? null;
  }

  private async buildReceiptUrl(orderId: string, email: string) {
    try {
      const token = await issueReceiptToken({ orderId, email });
      return `${getWebBaseUrl()}/thank-you/${orderId}?token=${encodeURIComponent(token)}`;
    } catch {
      return null;
    }
  }
}

export function createEmailService() {
  return new EmailService(selectEmailProvider());
}
