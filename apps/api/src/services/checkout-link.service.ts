import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireMerchantOrOwner } from '../auth/guards';
import { CheckoutLinkRepository } from '../repositories/checkout-link.repository';
import { ProductRepository } from '../repositories/product.repository';
import { DomainError } from '../errors/domain-error';
import { ERROR_CODES } from '../errors/codes';
import type { GraphQLContext } from '../server-context';
import { APP_ROLES } from '@ts-fullstack-learning/shared';

const linkInput = z.object({
  slug: z.string().min(1),
  productId: z.string().min(1),
  storeId: z.string().min(1).optional(),
});
type LinkInput = z.infer<typeof linkInput>;

const checkoutByLinkInput = z.object({
  slug: z.string().min(1),
  customerName: z.string().min(1),
  email: z.string().email(),
  quantity: z.number().int().min(1),
  shippingAddress: z.string().min(5),
  shippingNote: z.string().optional(),
});
type CheckoutByLinkInput = z.infer<typeof checkoutByLinkInput>;

export class CheckoutLinkService {
  constructor(
    private readonly repo = new CheckoutLinkRepository(),
    private readonly productRepo = new ProductRepository(),
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
      const ownsStore = await prisma.store.findFirst({
        where: { id: product.storeId, ownerId: userId },
        select: { id: true },
      });

      if (!ownsStore) {
        throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
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

    return prisma.$transaction(async (tx) => {
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
}
