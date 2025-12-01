'use server';

import { GraphQLClient } from 'graphql-request';
import { revalidatePath } from 'next/cache';
import { getEnv } from '../../lib/env';
import { CreateStoreDocument, type CreateStoreMutationVariables, type CreateStoreMutation } from '../../graphql/generated/graphql';

export async function createStoreAction(input: CreateStoreMutationVariables['input']) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  const res = await client.request<CreateStoreMutation, CreateStoreMutationVariables>(CreateStoreDocument, { input });
  revalidatePath('/stores');
  return res.createStore;
}
