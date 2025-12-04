import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const demoStoreId = 'demo-store';

  const store = await prisma.store.upsert({
    where: { id: demoStoreId },
    update: {},
    create: {
      id: demoStoreId,
      name: 'Demo store',
      email: 'demo@example.com',
    },
  });

  const products = [
    {
      name: 'Cozy Red Hoodie',
      price: 59.9,
      inStock: true,
    },
    {
      name: 'Ocean Blue Mug',
      price: 19.5,
      inStock: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {
        price: product.price,
        inStock: product.inStock,
        storeId: store.id,
      },
      create: {
        name: product.name,
        price: product.price,
        inStock: product.inStock,
        store: { connect: { id: store.id } },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  