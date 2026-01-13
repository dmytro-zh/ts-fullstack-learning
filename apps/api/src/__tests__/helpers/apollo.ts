import { createApolloServer } from '../../server';
import { APP_ROLES } from '@ts-fullstack-learning/shared';

export type TestAuth = { userId: string; role: string };

export function makeAuthContext(auth: TestAuth) {
  return {
    contextValue: {
      auth,
    },
  };
}

export async function createTestApolloServer() {
  const server = createApolloServer();
  await server.start();

  async function exec(args: { query: string; variables?: Record<string, unknown> }, auth?: TestAuth) {
    const res = await server.executeOperation(
      { query: args.query, variables: args.variables ?? {} },
      auth ? makeAuthContext(auth) : undefined,
    );

    if (res.body.kind !== 'single') {
      throw new Error('Unexpected GraphQL response kind');
    }

    const { data, errors } = res.body.singleResult;

    if (errors?.length) {
      // Keep it simple but readable
      const msg = errors.map((e) => e.message).join(' | ');
      throw new Error(`GraphQL errors: ${msg}`);
    }

    return data as any;
  }

  async function stop() {
    await server.stop();
  }

  return { server, exec, stop };
}

export const defaultMerchantAuth: TestAuth = {
  userId: 'test-owner',
  role: APP_ROLES.MERCHANT,
};
