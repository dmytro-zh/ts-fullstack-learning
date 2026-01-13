import { prismaTest } from './db';

export async function resetTestDb() {
  await prismaTest.order.deleteMany();
  await prismaTest.checkoutLink.deleteMany();
  await prismaTest.productImage.deleteMany();
  await prismaTest.product.deleteMany();
  await prismaTest.store.deleteMany();
  await prismaTest.user.deleteMany();
}
