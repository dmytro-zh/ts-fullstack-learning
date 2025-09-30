'use server';

import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env'; 
import { AddProductDocument, type AddProductMutationVariables } from '../../graphql/generated/graphql';

export async function addProductAction(input: AddProductMutationVariables) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  await client.request(AddProductDocument, input);
}
