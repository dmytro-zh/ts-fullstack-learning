import { ProductSchema } from '@ts-fullstack-learning/shared';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { ProductRepository } from '../repositories/product.repository';

const createProductInput = ProductSchema.pick({
  name: true,
  price: true,
  inStock: true,
}).extend({
  storeId: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
  quantity: z.number().int().min(0).optional(),
});

const updateProductInput = z.object({
  id: z.string().min(1),
  price: z.number(),
  inStock: z.boolean(),
  description: z.string().optional(),
  imageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
  quantity: z.number().int().min(0).optional(),
});

type CreateProductInput = z.infer<typeof createProductInput>;
type UpdateProductInput = z.infer<typeof updateProductInput>;

function normalizeNullable(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export class ProductService {
  constructor(private readonly repo = new ProductRepository()) {}

  getProducts() {
    return this.repo.findAllWithStore();
  }

  getProduct(id: string) {
    return this.repo.findByIdWithStore(id);
  }

  async addProduct(input: CreateProductInput) {
    const data = createProductInput.parse(input);
    const quantity = data.quantity ?? 0;
    const inStock =
      quantity > 0 ? data.inStock : false;

    return this.repo.create({
      name: data.name,
      price: data.price,
      inStock,
      quantity,
      description: normalizeNullable(data.description),
      imageUrl: normalizeNullable(data.imageUrl),
      store: {
        connect: {
          id: data.storeId,
        },
      },
    });
  }

  async updateProduct(input: UpdateProductInput) {
    const data = updateProductInput.parse(input);

    const updateData: Prisma.ProductUpdateInput = {
      price: data.price,
      inStock: data.inStock,
      description: normalizeNullable(data.description),
      imageUrl: normalizeNullable(data.imageUrl),
    };

    if (typeof data.quantity === 'number') {
      updateData.quantity = data.quantity;
      if (data.quantity <= 0) {
        updateData.inStock = false;
      }
    }

    return this.repo.update(data.id, updateData);
  }
}
