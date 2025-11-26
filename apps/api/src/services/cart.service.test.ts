import { describe, expect, it } from 'vitest';
import { CartService } from './cart.service';

class FakeProductRepo {
  constructor(private products: Record<string, any>) {}
  findById(id: string) {
    return Promise.resolve(this.products[id] ?? null);
  }
}

class FakeCartRepo {
  items: any[] = [];
  findAll() { return Promise.resolve(this.items); }
  findByProductId(productId: string) {
    return Promise.resolve(this.items.find((i) => i.productId === productId) ?? null);
  }
  create(productId: string, quantity: number) {
    const item = { id: String(this.items.length + 1), productId, quantity, product: { id: productId } };
    this.items.push(item);
    return Promise.resolve(item);
  }
  updateQuantity(id: string, quantity: number) {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new Error('Not found');
    item.quantity = quantity;
    return Promise.resolve(item);
  }
  delete(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    return Promise.resolve({ id });
  }
  findById(id: string) {
    return Promise.resolve(this.items.find((i) => i.id === id) ?? null);
  }
}

describe('CartService', () => {
  const productId = 'p1';
  const products = { [productId]: { id: productId, name: 'Test', price: 1, inStock: true } };

  it('throws on non-positive quantity', async () => {
    const service = new CartService(new FakeCartRepo() as any, new FakeProductRepo(products) as any);
    await expect(service.addCartItem({ productId, quantity: 0 })).rejects.toBeInstanceOf(Error);
  });

  it('throws when product not found', async () => {
    const service = new CartService(new FakeCartRepo() as any, new FakeProductRepo({}) as any);
    await expect(service.addCartItem({ productId, quantity: 1 })).rejects.toThrow('Product not found');
  });

  it('creates new cart item with product', async () => {
    const repo = new FakeCartRepo();
    const service = new CartService(repo as any, new FakeProductRepo(products) as any);
    const created = await service.addCartItem({ productId, quantity: 1 });
    expect(created.productId).toBe(productId);
    expect(created.quantity).toBe(1);
    expect(created.product).toBeDefined();
  });

  it('merges quantity for existing item', async () => {
    const repo = new FakeCartRepo();
    const service = new CartService(repo as any, new FakeProductRepo(products) as any);
    await service.addCartItem({ productId, quantity: 1 });
    const updated = await service.addCartItem({ productId, quantity: 2 });
    expect(updated.quantity).toBe(3);
  });

  it('removeCartItem deletes item', async () => {
    const repo = new FakeCartRepo();
    const service = new CartService(repo as any, new FakeProductRepo(products) as any);
    const created = await service.addCartItem({ productId, quantity: 1 });
    await service.removeCartItem(created.id);
    expect(repo.items).toHaveLength(0);
  });
});
