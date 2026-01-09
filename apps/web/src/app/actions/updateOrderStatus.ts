'use server';

import { createWebGraphQLClient } from '../../lib/graphql-client';
import {
  UpdateOrderStatusDocument,
  type UpdateOrderStatusMutation,
  type UpdateOrderStatusMutationVariables,
} from '../../graphql/generated/graphql';

export async function updateOrderStatusAction(input: UpdateOrderStatusMutationVariables) {
  const client = await createWebGraphQLClient();

  const data = await client.request<UpdateOrderStatusMutation, UpdateOrderStatusMutationVariables>(
    UpdateOrderStatusDocument,
    input,
  );

  return data.updateOrderStatus;
}
