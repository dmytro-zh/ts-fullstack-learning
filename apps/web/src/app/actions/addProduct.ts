'use server';

import { createWebGraphQLClient } from '../../lib/graphql-client';
import { AddProductDocument, type AddProductMutationVariables } from '../../graphql/generated/graphql';

type Input = AddProductMutationVariables;

export async function addProductAction(input: Input) {
  const client = await createWebGraphQLClient();
  await client.request(AddProductDocument, input);
}
