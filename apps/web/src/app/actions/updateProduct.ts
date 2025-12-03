'use server';

import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import {
  UpdateProductDocument,
  type UpdateProductMutationVariables,
} from '../../graphql/generated/graphql';

export async function updateProductAction(input: UpdateProductMutationVariables) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  await client.request(UpdateProductDocument, input);
}
