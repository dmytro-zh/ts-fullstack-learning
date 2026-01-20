import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';

const apiEnvPath = path.resolve(process.cwd(), 'apps/api/.env');
dotenv.config({ path: apiEnvPath });

const TEST_STORE_PREFIX = 'PW Store ';
const TEST_PRODUCT_PREFIX = 'PW Product ';
const TEST_LINK_PREFIX = 'pw-';
const TEST_BUYER_EMAIL_PREFIX = 'buyer+';
const TEST_BUYER_EMAIL_SUFFIX = '@example.com';

function buildOr<T>(clauses: T[]): { OR: T[] } {
  return { OR: clauses };
}

export async function cleanupTestData() {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('DATABASE_URL missing; skipping Playwright cleanup.');
    return;
  }

  const prisma = new PrismaClient();

  try {
    const stores = await prisma.store.findMany({
      where: { name: { startsWith: TEST_STORE_PREFIX } },
      select: { id: true },
    });
    const storeIds = stores.map((store) => store.id);

    const productWhere = buildOr<Prisma.ProductWhereInput>([
      ...(storeIds.length > 0 ? [{ storeId: { in: storeIds } }] : []),
      { name: { startsWith: TEST_PRODUCT_PREFIX } },
    ]);
    const products = await prisma.product.findMany({
      where: productWhere,
      select: { id: true },
    });
    const productIds = products.map((product) => product.id);

    const linkWhere = buildOr<Prisma.CheckoutLinkWhereInput>([
      ...(storeIds.length > 0 ? [{ storeId: { in: storeIds } }] : []),
      ...(productIds.length > 0 ? [{ productId: { in: productIds } }] : []),
      { slug: { startsWith: TEST_LINK_PREFIX } },
    ]);
    const links = await prisma.checkoutLink.findMany({
      where: linkWhere,
      select: { id: true },
    });
    const linkIds = links.map((link) => link.id);

    const orderClauses: Prisma.OrderWhereInput[] = [
      ...(storeIds.length > 0 ? [{ storeId: { in: storeIds } }] : []),
      ...(productIds.length > 0 ? [{ productId: { in: productIds } }] : []),
      ...(linkIds.length > 0 ? [{ checkoutLinkId: { in: linkIds } }] : []),
    ];
    if (orderClauses.length > 0) {
      await prisma.order.deleteMany({ where: { OR: orderClauses } });
    }

    if (productIds.length > 0) {
      await prisma.cartItem.deleteMany({ where: { productId: { in: productIds } } });
      await prisma.productImage.deleteMany({ where: { productId: { in: productIds } } });
    }

    await prisma.checkoutLink.deleteMany({ where: linkWhere });
    await prisma.product.deleteMany({ where: productWhere });

    if (storeIds.length > 0) {
      await prisma.store.deleteMany({ where: { id: { in: storeIds } } });
    }

    await prisma.user.deleteMany({
      where: {
        AND: [
          { email: { startsWith: TEST_BUYER_EMAIL_PREFIX } },
          { email: { endsWith: TEST_BUYER_EMAIL_SUFFIX } },
        ],
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
