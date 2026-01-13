'use server';

import { createWebGraphQLClient } from '../../lib/graphql-client';

const CHECKOUT_BY_LINK = /* GraphQL */ `
  mutation CheckoutByLink($input: CheckoutByLinkInput!) {
    checkoutByLink(input: $input) {
      id
      total
      quantity
      product {
        name
      }
      email
      shippingAddress
    }
  }
`;

export type CheckoutByLinkInput = {
  slug: string;
  customerName: string;
  email: string;
  quantity: number;
  shippingAddress: string;
  shippingNote?: string;
};

type CheckoutByLinkPayload = {
  checkoutByLink: {
    id: string;
    total: number;
    quantity: number;
    product: { name: string };
    email: string;
    shippingAddress: string;
  };
};

export async function checkoutByLinkAction(input: CheckoutByLinkInput) {
  const client = await createWebGraphQLClient();
  const res = await client.request<CheckoutByLinkPayload>(CHECKOUT_BY_LINK, { input });
  return res.checkoutByLink;
}
