'use server';
import { GraphQLClient } from 'graphql-request';
import { revalidatePath } from 'next/cache';
import { getEnv } from '../../lib/env';
import { CreateCheckoutLinkDocument, type CreateCheckoutLinkMutationVariables } from '../../graphql/generated/graphql';

export async function createCheckoutLinkAction(input: CreateCheckoutLinkMutationVariables['input']) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const res = await client.request(CreateCheckoutLinkDocument, { input });
  revalidatePath('/checkout-links');
  return res.createCheckoutLink;
}
