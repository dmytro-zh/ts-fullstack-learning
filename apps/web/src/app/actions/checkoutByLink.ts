'use server';

import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';

const CHECKOUT_BY_LINK = /* GraphQL */ `
  mutation CheckoutByLink($input: CheckoutByLinkInput!) {
    checkoutByLink(input: $input) {
      id
      total
      quantity
      product { name }
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
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const res = await client.request<CheckoutByLinkPayload>(CHECKOUT_BY_LINK, { input });
  return res.checkoutByLink;
}
