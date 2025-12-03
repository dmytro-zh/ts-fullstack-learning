import { GraphQLClient } from 'graphql-request';
import { getEnv } from '../../lib/env';
import { AddProductDocument, type AddProductMutationVariables } from '../../graphql/generated/graphql';

type Input = AddProductMutationVariables;

export async function addProductAction(input: Input) {
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);
  await client.request(AddProductDocument, input);
}
