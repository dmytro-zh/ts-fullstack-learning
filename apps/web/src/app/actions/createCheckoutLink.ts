'use server';

import { revalidatePath } from 'next/cache';
import { createWebGraphQLClient } from '../../lib/graphql-client';
import {
  CreateCheckoutLinkDocument,
  type CreateCheckoutLinkMutation,
  type CreateCheckoutLinkMutationVariables,
} from '../../graphql/generated/graphql';

export async function createCheckoutLinkAction(
  input: CreateCheckoutLinkMutationVariables['input'],
) {
  const client = await createWebGraphQLClient();

  const res = await client.request<CreateCheckoutLinkMutation, CreateCheckoutLinkMutationVariables>(
    CreateCheckoutLinkDocument,
    { input },
  );

  revalidatePath('/checkout-links');
  return res.createCheckoutLink;
}
