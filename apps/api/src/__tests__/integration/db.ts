import { prismaTest } from '../../lib/prisma-test';

export { prismaTest };

export async function resetDb() {
  await prismaTest.productImage.deleteMany();
  await prismaTest.cartItem.deleteMany();
  await prismaTest.order.deleteMany();
  await prismaTest.checkoutLink.deleteMany();
  await prismaTest.product.deleteMany();
  await prismaTest.store.deleteMany();
  await prismaTest.user.deleteMany();
}

export async function disconnectDb() {
  await prismaTest.$disconnect();
}
