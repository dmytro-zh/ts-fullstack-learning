'use server';

import { GraphQLClient } from 'graphql-request';
import { revalidatePath } from 'next/cache';
import { getEnv } from '../../lib/env';
import { RemoveCartItemDocument, type RemoveCartItemMutationVariables } from '../../graphql/generated/graphql';

export async function removeCartItemAction(input: RemoveCartItemMutationVariables) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  await client.request(RemoveCartItemDocument, input);
  revalidatePath('/');
}
