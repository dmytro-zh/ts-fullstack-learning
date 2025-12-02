import { test, expect, request } from '@playwright/test';

test('@smoke public checkout link works', async ({ page }) => {
  const api = await request.newContext({ baseURL: process.env.API_URL ?? 'http://localhost:4000/' });
  const slug = `pw-slug-${Date.now()}`;

  // create store
  const storeResp = await api.post('', {
    data: {
      query: 'mutation ($input: StoreInput!){ createStore(input:$input){ id name } }',
      variables: { input: { name: `PW Store ${Date.now()}`, email: 'store@example.com' } },
    },
  });
  const storeId = (await storeResp.json()).data.createStore.id;

  // create product
  const prodResp = await api.post('', {
    data: {
      query: 'mutation ($n:String!,$p:Float!,$s:Boolean!,$store:ID){ addProduct(name:$n, price:$p, inStock:$s, storeId:$store){ id name } }',
      variables: { n: `PW Product ${Date.now()}`, p: 12.34, s: true, store: storeId },
    },
  });
  const productId = (await prodResp.json()).data.addProduct.id;

  // create checkout link
  await api.post('', {
    data: {
      query: 'mutation ($input: CheckoutLinkInput!){ createCheckoutLink(input:$input){ slug } }',
      variables: { input: { slug, productId, storeId } },
    },
  });

  // open public checkout
  await page.goto(`/c/${slug}`);
  await page.getByLabel('Name').fill('Playwright Buyer');
  await page.getByLabel('Email').fill('buyer@example.com');
  await page.getByRole('button', { name: 'Buy now' }).click();

  await expect(page.getByText('Order')).toContainText('Order');
});
