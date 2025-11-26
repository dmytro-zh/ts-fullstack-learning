'use server';

import { GraphQLClient } from 'graphql-request';
import { revalidatePath } from 'next/cache';
import { getEnv } from '../../lib/env';
import { AddCartItemDocument, type AddCartItemMutationVariables } from '../../graphql/generated/graphql';

export async function addCartItemAction(input: AddCartItemMutationVariables) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  await client.request(AddCartItemDocument, input);
  revalidatePath('/');
}
