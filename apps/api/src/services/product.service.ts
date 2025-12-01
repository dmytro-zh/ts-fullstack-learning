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

type CreateProductInput = z.infer<typeof createProductInput>;

export class ProductService {
  constructor(private readonly repo = new ProductRepository()) {}

  getProducts() {
    return this.repo.findAll();
  }

  async addProduct(input: CreateProductInput) {
    const data = createProductInput.parse(input);
    return this.repo.create(data);
  }
}
