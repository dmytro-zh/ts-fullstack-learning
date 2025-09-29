import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    { name: 'Coffee',    price: 3.5, inStock: true },
    { name: 'Tea',       price: 2.9, inStock: false },
    { name: 'Milk',      price: 1.8, inStock: true },
    { name: 'Bread',     price: 2.2, inStock: true },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: product,
      create: product,
    });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
