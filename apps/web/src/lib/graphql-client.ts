import { GraphQLClient } from 'graphql-request';
import { cookies } from 'next/headers';

function getUpstreamGraphqlUrl() {
  const base = process.env.API_URL?.replace(/\/+$/, '');
  return base ? `${base}/graphql` : 'http://localhost:4000/graphql';
}

// Use in Server Components / Server Actions
export async function createWebGraphQLClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('api_token')?.value ?? null;

  return new GraphQLClient(getUpstreamGraphqlUrl(), {
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        cache: 'no-store',
      }),
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
}

// Use in Client Components (browser)
export function createBrowserGraphQLClient() {
  return new GraphQLClient('/api/graphql', {
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        credentials: 'include',
      }),
  });
}
