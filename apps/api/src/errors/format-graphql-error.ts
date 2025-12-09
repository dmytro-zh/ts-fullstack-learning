import type { GraphQLFormattedError, GraphQLError } from 'graphql';
import { DomainError } from './domain-error';

export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const graphQLError = error as GraphQLError | undefined;
  const originalError = graphQLError?.originalError;

  if (!(originalError instanceof DomainError)) {
    return formattedError;
  }

  return {
    ...formattedError,
    message: originalError.message,
    extensions: {
      ...formattedError.extensions,
      code: originalError.code,
      type: 'DOMAIN_ERROR',
      field: originalError.field ?? null,
    },
  };
}
