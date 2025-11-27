'use server';

import { GraphQLClient } from 'graphql-request';
import { revalidatePath } from 'next/cache';
import { getEnv } from '../../lib/env';
import {
  CheckoutDocument,
  type CheckoutMutation,
  type CheckoutMutationVariables,
} from '../../graphql/generated/graphql';

export async function checkoutAction(input: CheckoutMutationVariables['input']) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const res = await client.request<CheckoutMutation, CheckoutMutationVariables>(
    CheckoutDocument,
    { input },
  );
  revalidatePath('/');
  return res.checkout;
}
