'use server';

import { createWebGraphQLClient } from '../../lib/graphql-client';

const START_CHECKOUT_BY_LINK = /* GraphQL */ `
  mutation StartCheckoutByLink($input: CheckoutByLinkInput!) {
    startCheckoutByLink(input: $input) {
      orderId
      checkoutUrl
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
  startCheckoutByLink: {
    orderId: string;
    checkoutUrl: string;
  };
};

export async function checkoutByLinkAction(input: CheckoutByLinkInput) {
  const client = await createWebGraphQLClient();
  const res = await client.request<CheckoutByLinkPayload>(START_CHECKOUT_BY_LINK, { input });
  return res.startCheckoutByLink;
}
