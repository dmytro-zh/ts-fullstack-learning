import { GraphQLClient } from 'graphql-request';
import { cookies } from 'next/headers';
import { getServerBaseUrl } from './server-url';

export async function createServerGraphQLClient(): Promise<GraphQLClient> {
  const baseUrl = await getServerBaseUrl();

  // Forward cookies so /api/graphql sees api_token and can attach Authorization upstream
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  return new GraphQLClient(`${baseUrl}/api/graphql`, {
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        cache: 'no-store',
        headers: {
          ...(init?.headers ?? {}),
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
      }),
  });
}
