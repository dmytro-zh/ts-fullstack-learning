import {
  APP_PLANS,
  APP_ROLES,
  FREE_PLAN_LIMITS,
  ProductSchema,
} from '@ts-fullstack-learning/shared';
import { requireMerchantOrOwner } from '../auth/guards';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { ProductRepository } from '../repositories/product.repository';
import { UserRepository } from '../repositories/user.repository';
import { prisma } from '../lib/prisma';
import { DomainError } from '../errors/domain-error';
import { ERROR_CODES } from '../errors/codes';
import type { GraphQLContext } from '../server-context';

const nullableTrimmedString = z.string().nullable().optional();
const nullableImageUrl = z
  .union([z.string().url(), z.literal('')])
  .nullable()
  .optional();

const createProductInput = ProductSchema.pick({
  name: true,
  price: true,
}).extend({
  storeId: z.string().min(1),
  description: nullableTrimmedString,
  imageUrl: nullableImageUrl,
  quantity: z.number().int().min(0).optional(),
});

const updateProductInput = z.object({
  id: z.string().min(1),
  price: z.number(),
  description: nullableTrimmedString,
  imageUrl: nullableImageUrl,
  quantity: z.number().int().min(0).optional(),
});

type CreateProductInput = z.infer<typeof createProductInput>;
type UpdateProductInput = z.infer<typeof updateProductInput>;

function normalizeNullable(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class ProductService {
  constructor(
    private readonly repo = new ProductRepository(),
    private readonly userRepo = new UserRepository(),
  ) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugifyName(name) || 'product';
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await this.repo.findBySlug(slug);
      if (!existing) return slug;
      counter += 1;
      slug = `${base}-${counter}`;
    }
  }

  getProducts(ctx: GraphQLContext) {
    requireMerchantOrOwner(ctx);
    return this.repo.findAllWithStore();
  }

  getProduct(ctx: GraphQLContext, id: string) {
    requireMerchantOrOwner(ctx);
    return this.repo.findByIdWithStore(id);
  }

  async addProduct(ctx: GraphQLContext, input: CreateProductInput) {
    const data = createProductInput.parse(input);

    requireMerchantOrOwner(ctx);
    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    if (ctx.auth.role !== APP_ROLES.PLATFORM_OWNER) {
      const ownsStore = await this.repo.isStoreOwnedBy(data.storeId, userId);
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
        if (count >= FREE_PLAN_LIMITS.products) {
          throw new DomainError(ERROR_CODES.PLAN_LIMIT_EXCEEDED, 'Product limit reached');
        }
      }
    }

    const quantity = data.quantity ?? 0;
    const inStock = quantity > 0;
    const slug = await this.generateUniqueSlug(data.name);

    return this.repo.create({
      slug,
      name: data.name,
      price: data.price,
      inStock,
      quantity,
      description: normalizeNullable(data.description),
      imageUrl: normalizeNullable(data.imageUrl),
      store: {
        connect: { id: data.storeId },
      },
    });
  }

  async updateProduct(ctx: GraphQLContext, input: UpdateProductInput) {
    const data = updateProductInput.parse(input);

    requireMerchantOrOwner(ctx);
    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    const product = await this.repo.findById(data.id);
    if (!product) {
      throw new DomainError(ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', { field: 'id' });
    }

    if (!product.storeId) {
      throw new DomainError(ERROR_CODES.NOT_FOUND, 'Product store not found');
    }

    if (ctx.auth.role !== APP_ROLES.PLATFORM_OWNER) {
      const ownsStore = await this.repo.isStoreOwnedBy(product.storeId, userId);
      if (!ownsStore) {
        throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
      }
    }

    const updateData: Prisma.ProductUpdateInput = {
      price: data.price,
      description: normalizeNullable(data.description),
      imageUrl: normalizeNullable(data.imageUrl),
    };

    if (typeof data.quantity === 'number') {
      updateData.quantity = data.quantity;
      updateData.inStock = data.quantity > 0;
    }

    return this.repo.update(data.id, updateData);
  }

  async deleteProduct(ctx: GraphQLContext, id: string) {
    requireMerchantOrOwner(ctx);
    const userId = ctx.auth.userId;
    if (!userId) {
      throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
    }

    if (!id || id.trim().length === 0) {
      throw new DomainError(ERROR_CODES.INVALID_CHECKOUT_INPUT, 'Invalid product id', {
        field: 'id',
      });
    }

    // Use a transaction because we deactivate links and soft-delete the product together.
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id, deletedAt: null, isActive: true },
      });

      if (!product) {
        throw new DomainError(ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', {
          field: 'id',
        });
      }

      if (!product.storeId) {
        throw new DomainError(ERROR_CODES.NOT_FOUND, 'Product store not found');
      }

      if (ctx.auth.role !== APP_ROLES.PLATFORM_OWNER) {
        const ownsStore = await tx.store.findFirst({
          where: { id: product.storeId, ownerId: userId },
          select: { id: true },
        });

        if (!ownsStore) {
          throw new DomainError(ERROR_CODES.FORBIDDEN, 'Access denied');
        }
      }

      // Deactivate checkout links for this product
      await tx.checkoutLink.updateMany({
        where: { productId: id, active: true },
        data: { active: false },
      });

      // Soft delete product
      return tx.product.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
          inStock: false,
          quantity: 0,
        },
      });
    });
  }
}
