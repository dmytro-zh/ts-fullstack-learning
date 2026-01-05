'use server';

import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import { DeleteProductDocument, type DeleteProductMutation, type DeleteProductMutationVariables } from '../../graphql/generated/graphql';

export async function deleteProductAction(id: string) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);

  const data = await client.request<DeleteProductMutation, DeleteProductMutationVariables>(
    DeleteProductDocument,
    { id },
  );

  if (!data.deleteProduct) {
    throw new Error('Failed to delete product');
  }

  return data.deleteProduct;
}
