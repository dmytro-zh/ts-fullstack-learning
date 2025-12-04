'use server';

import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import {
  UpdateOrderStatusDocument,
  type UpdateOrderStatusMutation,
  type UpdateOrderStatusMutationVariables,
} from '../../graphql/generated/graphql';

export async function updateOrderStatusAction(input: UpdateOrderStatusMutationVariables) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);

  const data = await client.request<
    UpdateOrderStatusMutation,
    UpdateOrderStatusMutationVariables
  >(UpdateOrderStatusDocument, input);

  return data.updateOrderStatus;
}