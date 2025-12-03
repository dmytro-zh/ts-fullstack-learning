import { ProductSchema } from '@ts-fullstack-learning/shared';
import { z } from 'zod';
import { ProductRepository } from '../repositories/product.repository';

const createProductInput = ProductSchema.pick({
  name: true,
  price: true,
  inStock: true,
}).extend({
  storeId: z.string().optional(),
});

const updateProductInput = z.object({
  id: z.string().min(1),
  price: z.number(),
  inStock: z.boolean(),
});

type CreateProductInput = z.infer<typeof createProductInput>;
type UpdateProductInput = z.infer<typeof updateProductInput>;

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
    return this.repo.create(data);
  }

  async updateProduct(input: UpdateProductInput) {
    const data = updateProductInput.parse(input);
    return this.repo.update(data.id, { price: data.price, inStock: data.inStock });
  }
}
