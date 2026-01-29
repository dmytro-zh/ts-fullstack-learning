import type { EmailProvider, MerchantNewOrderEmail, OrderReceiptEmail } from './email-provider';

type ResendEmailProviderOptions = {
  apiKey: string;
  from: string;
  replyTo?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(total: number) {
  return `$${total.toFixed(2)}`;
}

export class ResendEmailProvider implements EmailProvider {
  constructor(private readonly options: ResendEmailProviderOptions) {}

  async sendOrderReceipt(input: OrderReceiptEmail): Promise<void> {
    const subject = `Order received${input.storeName ? ` · ${input.storeName}` : ''}`;
    const total = formatMoney(input.total);
    const productLine = `${input.productName} × ${input.quantity}`;

    const html = `
      <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111">
        <h2 style="margin:0 0 12px">Thanks for your order${input.customerName ? `, ${escapeHtml(input.customerName)}` : ''}!</h2>
        <p style="margin:0 0 8px">Order ID: <strong>${escapeHtml(input.orderId)}</strong></p>
        <p style="margin:0 0 8px">${escapeHtml(productLine)}</p>
        <p style="margin:0 0 8px">Total: <strong>${total}</strong></p>
        ${input.shippingAddress ? `<p style="margin:0 0 8px">Shipping: ${escapeHtml(input.shippingAddress)}</p>` : ''}
        ${input.receiptUrl ? `<p style="margin:12px 0 0"><a href="${escapeHtml(input.receiptUrl)}">View your receipt</a></p>` : ''}
      </div>
    `;

    const text = `Thanks for your order${input.customerName ? `, ${input.customerName}` : ''}!
Order ID: ${input.orderId}
${productLine}
Total: ${total}
${input.shippingAddress ? `Shipping: ${input.shippingAddress}\n` : ''}${input.receiptUrl ? `Receipt: ${input.receiptUrl}` : ''}`;

    await this.sendEmail(input.to, subject, html, text);
  }

  async sendMerchantNewOrder(input: MerchantNewOrderEmail): Promise<void> {
    const subject = `New order${input.storeName ? ` · ${input.storeName}` : ''}`;
    const total = formatMoney(input.total);
    const productLine = `${input.productName} × ${input.quantity}`;

    const html = `
      <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111">
        <h2 style="margin:0 0 12px">New order received</h2>
        <p style="margin:0 0 8px">Order ID: <strong>${escapeHtml(input.orderId)}</strong></p>
        <p style="margin:0 0 8px">Customer: ${escapeHtml(input.customerName)} (${escapeHtml(input.customerEmail)})</p>
        <p style="margin:0 0 8px">${escapeHtml(productLine)}</p>
        <p style="margin:0 0 8px">Total: <strong>${total}</strong></p>
        ${input.shippingAddress ? `<p style="margin:0 0 8px">Shipping: ${escapeHtml(input.shippingAddress)}</p>` : ''}
        ${input.shippingNote ? `<p style="margin:0">Note: ${escapeHtml(input.shippingNote)}</p>` : ''}
      </div>
    `;

    const text = `New order received
Order ID: ${input.orderId}
Customer: ${input.customerName} (${input.customerEmail})
${productLine}
Total: ${total}
${input.shippingAddress ? `Shipping: ${input.shippingAddress}\n` : ''}${input.shippingNote ? `Note: ${input.shippingNote}` : ''}`;

    await this.sendEmail(input.to, subject, html, text);
  }

  private async sendEmail(to: string, subject: string, html: string, text: string) {
    const payload = {
      from: this.options.from,
      to,
      subject,
      html,
      text,
      reply_to: this.options.replyTo ?? undefined,
    };

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Resend email failed: ${resp.status} ${body}`);
    }
  }
}
