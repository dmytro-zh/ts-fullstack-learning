'use server';

import { createWebGraphQLClient } from '../../lib/graphql-client';
import {
  DeleteProductDocument,
  type DeleteProductMutation,
  type DeleteProductMutationVariables,
} from '../../graphql/generated/graphql';

export async function deleteProductAction(id: string) {
  const client = await createWebGraphQLClient();

  const data = await client.request<DeleteProductMutation, DeleteProductMutationVariables>(
    DeleteProductDocument,
    { id },
  );

  if (!data.deleteProduct) {
    throw new Error('Failed to delete product');
  }

  return data.deleteProduct;
}
