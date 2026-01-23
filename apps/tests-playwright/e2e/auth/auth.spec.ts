import { test } from '../../fixtures/test-fixtures';
import { prisma } from '../../../api/src/lib/prisma';

async function createMerchantInvite(email: string) {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const code = `pw-${seed}`;

  await prisma.merchantInvite.create({
    data: { code, email },
  });

  return code;
}

test('@smoke merchant login shows core links and no admin', async ({ pages, roles }) => {
  await pages.login.login(roles.merchant);

  await pages.nav.expectMerchantNav();

  await pages.nav.signOut();
  await pages.nav.expectSignedOut();
});

test('@smoke merchant can open stores and checkout links pages', async ({ pages, roles }) => {
  await pages.login.login(roles.merchant);

  await pages.stores.goto();
  await pages.stores.expectFormVisible();

  await pages.checkoutLinks.goto();
  await pages.checkoutLinks.expectFormVisible();
});

test('@smoke owner sees admin link', async ({ pages, roles }) => {
  await pages.login.login(roles.owner);

  await pages.nav.expectOwnerNav();

  await pages.admin.goto();
  await pages.admin.expectVisible();
  await pages.admin.expectTitleVisible();
});

test('@smoke merchant can register via invite', async ({ pages }) => {
  const seed = Date.now();
  const email = `merchant+${seed}@example.com`;
  const password = `Merchant!${seed}Aa`;
  const inviteCode = await createMerchantInvite(email);

  await pages.register.register({ inviteCode, email, password });

  await pages.nav.signOut();
  await pages.nav.expectSignedOut();
});

test('@smoke signed-in user is redirected from register', async ({ pages, roles }) => {
  await pages.login.login(roles.merchant);

  await pages.register.goto();
  await pages.register.expectRedirectedToDashboard();
});
