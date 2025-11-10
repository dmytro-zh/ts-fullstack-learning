import { z } from 'zod';
import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';

const addCartItemInput = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export class CartService {
  constructor(
    private readonly repo = new CartRepository(),
    private readonly productRepo = new ProductRepository(),
  ) {}

  getCartItems() {
    return this.repo.findAll();
  }

  async addCartItem(input: z.infer<typeof addCartItemInput>) {
    const data = addCartItemInput.parse(input);

    const product = await this.productRepo.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const existing = await this.repo.findByProductId(data.productId);
    if (existing) {
      const nextQuantity = existing.quantity + data.quantity;
      return this.repo.updateQuantity(existing.id, nextQuantity);
    }

    return this.repo.create(data.productId, data.quantity);
  }

  async removeCartItem(id: string) {
    if (!id) {
      throw new Error('Cart item id is required');
    }

    await this.repo.delete(id);
    return true;
  }
}
