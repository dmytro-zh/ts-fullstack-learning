import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const merchantEmail = 'merchant@local.dev';
  const ownerEmail = 'owner@local.dev';

  const merchant = await prisma.user.upsert({
    where: { email: merchantEmail },
    update: { role: 'MERCHANT' },
    create: { email: merchantEmail, role: 'MERCHANT' },
    select: { id: true, email: true, role: true },
  });

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { role: 'PLATFORM_OWNER' },
    create: { email: ownerEmail, role: 'PLATFORM_OWNER' },
    select: { id: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    // 1) All stores -> merchant
    const storesUpd = await tx.store.updateMany({
      data: { ownerId: merchant.id },
    });

    // 2) Orders with null storeId -> set from product.storeId
    const orders = await tx.order.findMany({
      where: { storeId: null },
      select: { id: true, productId: true },
    });

    let ordersFixed = 0;
    for (const o of orders) {
      const p = await tx.product.findUnique({
        where: { id: o.productId },
        select: { storeId: true },
      });

      if (p?.storeId) {
        await tx.order.update({
          where: { id: o.id },
          data: { storeId: p.storeId },
        });
        ordersFixed += 1;
      }
    }

    // 3) CheckoutLinks with null storeId -> set from product.storeId
    const links = await tx.checkoutLink.findMany({
      where: { storeId: null },
      select: { id: true, productId: true },
    });

    let linksFixed = 0;
    for (const l of links) {
      const p = await tx.product.findUnique({
        where: { id: l.productId },
        select: { storeId: true },
      });

      if (p?.storeId) {
        await tx.checkoutLink.update({
          where: { id: l.id },
          data: { storeId: p.storeId },
        });
        linksFixed += 1;
      }
    }

    return { storesUpdated: storesUpd.count, ordersFixed, linksFixed };
  });

  console.log('Migration done:', result);
  console.log('Merchant:', merchant);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  