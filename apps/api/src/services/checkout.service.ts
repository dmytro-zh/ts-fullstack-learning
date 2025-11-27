import { z } from 'zod';
import { CartRepository } from '../repositories/cart.repository';
import { OrderRepository, OrderItemRepository } from '../repositories/order.repository';
import { prisma } from '../lib/prisma';

const checkoutInput = z.object({
  customerName: z.string().min(1),
  email: z.string().email(),
});

type CheckoutInput = z.infer<typeof checkoutInput>;

export class CheckoutService {
  constructor(
    private readonly cartRepo = new CartRepository(),
    private readonly orderRepo = new OrderRepository(),
    private readonly orderItemRepo = new OrderItemRepository(),
  ) {}

  async checkout(input: CheckoutInput) {
    const { customerName, email } = checkoutInput.parse(input);

    const cartItems = await this.cartRepo.findAll();
    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    const total = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: { customerName, email, total },
      });

      await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.product.price,
        })),
      });

      await tx.cartItem.deleteMany({});

      return order;
    });

    return result;
  }
}
