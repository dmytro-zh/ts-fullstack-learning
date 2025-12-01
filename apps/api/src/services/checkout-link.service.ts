import { z } from 'zod';
import { CheckoutLinkRepository } from '../repositories/checkout-link.repository';
import { ProductRepository } from '../repositories/product.repository';

const linkInput = z.object({
  slug: z.string().min(1),
  productId: z.string().min(1),
  storeId: z.string().min(1).optional(),
});
type LinkInput = z.infer<typeof linkInput>;

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
}
