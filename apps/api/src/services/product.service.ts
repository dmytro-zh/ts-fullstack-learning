import { ProductSchema } from '@ts-fullstack-learning/shared';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { ProductRepository } from '../repositories/product.repository';

const nullableTrimmedString = z.string().nullable().optional();
const nullableImageUrl = z.union([z.string().url(), z.literal('')]).nullable().optional();

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
  constructor(private readonly repo = new ProductRepository()) {}

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

  getProducts() {
    return this.repo.findAllWithStore();
  }

  getProduct(id: string) {
    return this.repo.findByIdWithStore(id);
  }

  async addProduct(input: CreateProductInput) {
    const data = createProductInput.parse(input);
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

  async updateProduct(input: UpdateProductInput) {
    const data = updateProductInput.parse(input);

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
}
