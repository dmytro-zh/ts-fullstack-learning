import { test, expect } from '../../fixtures/test-fixtures';
import { createApiClient, createProduct, createStore } from '../../helpers/api-client';

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

test('@regression blocked store disables checkout links', async ({ pages, roles }) => {
  const suffix = uniqueSuffix();
  const storeName = `PW Store ${suffix}`;
  const productName = `PW Product ${suffix}`;

  const merchantApi = await createApiClient(roles.merchant);
  const ownerApi = await createApiClient(roles.owner);

  let storeId = '';

  try {
    const store = await createStore(merchantApi.gql, {
      name: storeName,
      email: `owner-${suffix}@ex.com`,
    });
    storeId = store.id;

    await createProduct(merchantApi.gql, {
      name: productName,
      price: 12,
      quantity: 2,
      storeId,
    });

    const blockResp = await ownerApi.authApi.post(`/admin/stores/${storeId}/status`, {
      data: { isActive: false },
    });
    expect(blockResp.ok()).toBeTruthy();
  } finally {
    await merchantApi.dispose();
    await ownerApi.dispose();
  }

  await pages.login.login(roles.merchant);
  await pages.dashboard.goto(storeId);
  await pages.dashboard.expectVisible();
  await expect(pages.dashboard.storeList().getByText('Blocked')).toBeVisible();
  await expect(pages.dashboard.blockedOverlay()).toBeVisible();

  await pages.checkoutLinks.goto(storeId);
  const submit = pages.checkoutLinks.submitButton();
  await expect(submit).toBeDisabled();
  await expect(submit).toHaveText(/Store is blocked/i);
});
