import { PrismaClient } from '@prisma/client';
import { APP_ROLES } from '@ts-fullstack-learning/shared';

const prisma = new PrismaClient();

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const demoStoreId = 'demo-store';

  // 1) Demo users (idempotent)
  const merchant = await prisma.user.upsert({
    where: { email: 'merchant@local.dev' },
    update: { role: APP_ROLES.MERCHANT },
    create: {
      email: 'merchant@local.dev',
      role: APP_ROLES.MERCHANT,
    },
    select: { id: true },
  });

  await prisma.user.upsert({
    where: { email: 'owner@local.dev' },
    update: { role: APP_ROLES.PLATFORM_OWNER },
    create: {
      email: 'owner@local.dev',
      role: APP_ROLES.PLATFORM_OWNER,
    },
    select: { id: true },
  });

  // 2) Demo store belongs to merchant (so ownership checks work)
  const store = await prisma.store.upsert({
    where: { id: demoStoreId },
    update: {
      name: 'Demo store',
      email: 'demo@example.com',
      ownerId: merchant.id,
    },
    create: {
      id: demoStoreId,
      name: 'Demo store',
      email: 'demo@example.com',
      ownerId: merchant.id,
    },
  });

  // 3) Products
  await prisma.product.upsert({
    where: { name: 'Family Christmas Tree Ornament' },
    update: {
      price: 4.99,
      inStock: true,
      quantity: 10,
      storeId: store.id,
    },
    create: {
      slug: slugifyName('Family Christmas Tree Ornament'),
      name: 'Family Christmas Tree Ornament',
      price: 4.99,
      inStock: true,
      quantity: 10,
      store: {
        connect: { id: store.id },
      },
    },
  });

  const products = [
    {
      name: 'Cozy Red Hoodie',
      price: 59.9,
      inStock: true,
      quantity: 25,
    },
    {
      name: 'Ocean Blue Mug',
      price: 19.5,
      inStock: true,
      quantity: 40,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {
        price: product.price,
        inStock: product.inStock,
        quantity: product.quantity,
        storeId: store.id,
      },
      create: {
        slug: slugifyName(product.name),
        name: product.name,
        price: product.price,
        inStock: product.inStock,
        quantity: product.quantity,
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
  