import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireMerchantOrOwner } from '../auth/guards';
import { CheckoutLinkRepository } from '../repositories/checkout-link.repository';
import { ProductRepository } from '../repositories/product.repository';
import { StoreRepository } from '../repositories/store.repository';
import { UserRepository } from '../repositories/user.repository';
import { APP_PLANS, APP_ROLES, FREE_PLAN_LIMITS } from '@ts-fullstack-learning/shared';
import { DomainError } from '../errors/domain-error';
import { ERROR_CODES } from '../errors/codes';
import type { GraphQLContext } from '../server-context';
import type { Prisma } from '@prisma/client';
import { getStripe } from '../lib/stripe';
import { issueReceiptToken } from '../auth/receipt-token';
import { createEmailService } from '../email/email.service';

const emailService = createEmailService();

function getCheckoutCurrency() {
  return (process.env.CHECKOUT_CURRENCY ?? 'cad').toLowerCase();
}

const linkInput = z.object({
  slug: z.string().min(1),
  productId: z.string().min(1),
  storeId: z.string().min(1).optional(),
});
type LinkInput = z.infer<typeof linkInput>;

const checkoutByLinkInput = z.object({
  slug: z.string().min(1),
  customerName: z.string().trim().min(2),
  email: z.string().trim().email(),
  quantity: z.number().int().min(1),
  shippingAddress: z.string().trim().min(10),
  shippingNote: z.string().trim().max(500).optional(),
});
type CheckoutByLinkInput = z.infer<typeof checkoutByLinkInput>;

function getWebBaseUrl() {
  return (process.env.WEB_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/g, '');
}

export class CheckoutLinkService {
  constructor(
    private readonly repo = new CheckoutLinkRepository(),
    private readonly productRepo = new ProductRepository(),
    private readonly storeRepo = new StoreRepository(),
    private readonly userRepo = new UserRepository(),
  ) {}

  async createLink(ctx: GraphQLContext, input: LinkInput) {
    const { slug, productId, storeId } = linkInput.parse(input);

    requireMerchantOrOwner(ctx);
    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw new DomainError(ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', {
        field: 'productId',
      });
    }

    if (!product.storeId) {
      throw new DomainError(ERROR_CODES.NOT_FOUND, 'Product store not found', {
        field: 'productId',
      });
    }

    if (storeId && storeId !== product.storeId) {
      throw new DomainError(
        ERROR_CODES.INVALID_CHECKOUT_INPUT,
        'Product does not belong to store',
        {
          field: 'storeId',
        },
      );
    }

    if (ctx.auth.role !== APP_ROLES.PLATFORM_OWNER) {
      const ownsStore = await this.storeRepo.findByIdForOwner(product.storeId, userId);

      if (!ownsStore) {
        throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
      }
    }

    if (ctx.auth.role !== APP_ROLES.PLATFORM_OWNER) {
      const billing = await this.userRepo.getBillingForUser(userId);
      if (!billing) {
        throw new DomainError(ERROR_CODES.NOT_FOUND, 'User not found');
      }
      if (
        billing.plan === APP_PLANS.PRO &&
        billing.subscriptionStatus &&
        billing.subscriptionStatus !== 'ACTIVE'
      ) {
        throw new DomainError(ERROR_CODES.SUBSCRIPTION_INACTIVE, 'Subscription is not active');
      }
      if (billing.plan === APP_PLANS.FREE) {
        const count = await this.repo.countByOwner(userId);
        if (count >= FREE_PLAN_LIMITS.checkoutLinks) {
          throw new DomainError(ERROR_CODES.PLAN_LIMIT_EXCEEDED, 'Checkout link limit reached');
        }
      }
    }

    const existing = await this.repo.findBySlug(slug);

    if (existing) {
      const sameProduct = existing.productId === productId;
      const sameStore = (existing.storeId ?? null) === (product.storeId ?? null);

      if (sameProduct && sameStore) {
        if (!existing.active) {
          return this.repo.update(existing.id, { active: true });
        }
        return existing;
      }

      throw new DomainError(
        ERROR_CODES.INVALID_CHECKOUT_INPUT,
        'Checkout link slug is already taken',
        { field: 'slug' },
      );
    }

    return this.repo.create({
      slug,
      product: { connect: { id: productId } },
      store: { connect: { id: product.storeId } },
    });
  }

  getBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }

  async checkoutByLink(input: CheckoutByLinkInput) {
    const parsed = checkoutByLinkInput.parse(input);
    const { slug, customerName, email, quantity, shippingAddress, shippingNote } = parsed;

    // Use a transaction because we update inventory and create an order atomically.
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const link = await tx.checkoutLink.findUnique({
        where: { slug },
        include: {
          product: true,
        },
      });

      if (!link || !link.active || !link.product) {
        throw new DomainError(
          ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
          'Checkout link not found or inactive',
          { field: 'slug' },
        );
      }

      const product = link.product;

      // Do not allow checkout for inactive/soft-deleted products
      if (product.deletedAt || product.isActive === false) {
        throw new DomainError(
          ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
          'Checkout link not found or inactive',
          { field: 'slug' },
        );
      }

      if (product.quantity <= 0 || product.quantity < quantity) {
        throw new DomainError(ERROR_CODES.INVALID_CHECKOUT_INPUT, 'Product is out of stock', {
          field: 'quantity',
        });
      }

      const newQuantity = product.quantity - quantity;

      await tx.product.update({
        where: { id: product.id },
        data: {
          quantity: newQuantity,
          inStock: newQuantity > 0,
        },
      });

      const total = product.price * quantity;

      return tx.order.create({
        data: {
          customerName,
          email,
          quantity,
          total,
          shippingAddress,
          shippingNote: shippingNote ?? null,
          status: 'PAID',
          checkoutLinkId: link.id,
          storeId: link.storeId ?? null,
          productId: product.id,
        },
        include: {
          product: true,
        },
      });
    });
  }

  async startCheckoutByLink(input: CheckoutByLinkInput) {
    const parsed = checkoutByLinkInput.parse(input);
    const { slug, customerName, email, quantity, shippingAddress, shippingNote } = parsed;

    const { order, product } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const link = await tx.checkoutLink.findUnique({
        where: { slug },
        include: { product: true },
      });

      if (!link || !link.active || !link.product) {
        throw new DomainError(
          ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
          'Checkout link not found or inactive',
          { field: 'slug' },
        );
      }

      const currentProduct = link.product;

      if (currentProduct.deletedAt || currentProduct.isActive === false) {
        throw new DomainError(
          ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
          'Checkout link not found or inactive',
          { field: 'slug' },
        );
      }

      if (currentProduct.quantity <= 0 || currentProduct.quantity < quantity) {
        throw new DomainError(ERROR_CODES.INVALID_CHECKOUT_INPUT, 'Product is out of stock', {
          field: 'quantity',
        });
      }

      const newQuantity = currentProduct.quantity - quantity;
      await tx.product.update({
        where: { id: currentProduct.id },
        data: {
          quantity: newQuantity,
          inStock: newQuantity > 0,
        },
      });

      const total = currentProduct.price * quantity;

      const order = await tx.order.create({
        data: {
          customerName,
          email,
          quantity,
          total,
          shippingAddress,
          shippingNote: shippingNote ?? null,
          status: 'PENDING_PAYMENT',
          checkoutLinkId: link.id,
          storeId: link.storeId ?? null,
          productId: currentProduct.id,
        },
      });

      return { order, product: currentProduct };
    });

    const baseUrl = getWebBaseUrl();

    if (process.env.CHECKOUT_TEST_MODE === '1') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });
      await emailService.sendOrderPaidEmails(order.id);
      const token = await issueReceiptToken({ orderId: order.id, email: order.email });
      return { orderId: order.id, checkoutUrl: `${baseUrl}/thank-you/${order.id}?token=${token}` };
    }

    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        line_items: [
          {
            quantity,
            price_data: {
              currency: getCheckoutCurrency(),
              unit_amount: Math.round(product.price * 100),
              product_data: { name: product.name },
            },
          },
        ],
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/c/${slug}?status=cancelled`,
        metadata: {
          orderId: order.id,
          slug,
        },
      });

      if (!session.url) {
        throw new Error('Stripe session is missing url');
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          checkoutSessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : null,
        },
      });

      return { orderId: order.id, checkoutUrl: session.url };
    } catch (err) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });
      await prisma.product.update({
        where: { id: order.productId },
        data: {
          quantity: { increment: quantity },
          inStock: true,
        },
      });
      throw err;
    }
  }
}
