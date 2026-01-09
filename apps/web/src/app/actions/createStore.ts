'use server';

import { revalidatePath } from 'next/cache';
import { createWebGraphQLClient } from '../../lib/graphql-client';
import {
  CreateStoreDocument,
  type CreateStoreMutationVariables,
  type CreateStoreMutation,
} from '../../graphql/generated/graphql';

export async function createStoreAction(input: CreateStoreMutationVariables['input']) {
  const client = await createWebGraphQLClient();
  const res = await client.request<CreateStoreMutation, CreateStoreMutationVariables>(
    CreateStoreDocument,
    { input },
  );

  revalidatePath('/stores');
  return res.createStore;
}
