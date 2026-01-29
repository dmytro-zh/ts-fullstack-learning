import { test, expect } from '../../fixtures/test-fixtures';
import { prisma } from '../../../api/src/lib/prisma';

async function createInvite(email: string) {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const code = `pw-${seed}`;
  await prisma.merchantInvite.create({ data: { code, email } });
  return code;
}

test('invite email must match (shows error)', async ({ pages }) => {
  const seed = Date.now();
  const inviteEmail = `merchant+${seed}@example.com`;
  const wrongEmail = `merchant+wrong-${seed}@example.com`;
  const password = `Merchant!${seed}Aa`;
  const inviteCode = await createInvite(inviteEmail);

  await pages.register.goto();
  await pages.register.expectFormVisible();

  await pages.register.inviteField().fill(inviteCode);
  await pages.register.emailField().fill(wrongEmail);
  await pages.register.passwordField().fill(password);
  await pages.register.confirmField().fill(password);
  await pages.register.submitButton().click();

  await expect(pages.register.container()).toBeVisible();
  await expect(pages.register.container()).toContainText('Invalid invite code.');
});
