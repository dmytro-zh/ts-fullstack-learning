import { z } from 'zod';
import { CheckoutLinkRepository } from '../repositories/checkout-link.repository';
import { ProductRepository } from '../repositories/product.repository';
import { prisma } from '../lib/prisma';

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
  shippingNote: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
});
type CheckoutByLinkInput = z.infer<typeof checkoutByLinkInput>;

export class CheckoutLinkService {
  constructor(
    private readonly repo = new CheckoutLinkRepository(),
    private readonly productRepo = new ProductRepository(),
  ) {}

  async createLink(input: LinkInput) {
    const { slug, productId, storeId } = linkInput.parse(input);

    const product = await this.productRepo.findById(productId);
    if (!product) throw new Error('Product not found');

    return this.repo.create({
      slug,
      product: { connect: { id: productId } },
      ...(storeId ? { store: { connect: { id: storeId } } } : {}),
    });
  }

  getBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }

  async checkoutByLink(input: CheckoutByLinkInput) {
    const { slug, customerName, email, shippingNote, quantity } = checkoutByLinkInput.parse(input);

    const link = await this.repo.findBySlug(slug);
    if (!link || !link.active) {
      throw new Error('Checkout link not found or inactive');
    }

    const product = await this.productRepo.findById(link.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const total = product.price * quantity;

    return prisma.order.create({
      data: {
        customerName,
        email,
        shippingNote: shippingNote ?? null,
        quantity,
        total,
        status: 'PENDING',
        checkoutLinkId: link.id,
        storeId: link.storeId ?? null,
        productId: product.id,
      },
    });
  }
}
