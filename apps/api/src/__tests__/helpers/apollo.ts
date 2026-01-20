import { createApolloServer } from '../../server';
import { APP_PLANS, APP_ROLES, type AppPlan } from '@ts-fullstack-learning/shared';
import { prismaTest } from '../integration/db';

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];
export type TestAuth = { userId: string; role: AppRole };

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

  async function exec(
    args: { query: string; variables?: Record<string, unknown> },
    auth?: TestAuth,
  ) {
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

export async function ensureTestUser(auth: TestAuth, plan: AppPlan = APP_PLANS.PRO) {
  const email = `${auth.userId}@test.local`;

  await prismaTest.user.upsert({
    where: { id: auth.userId },
    update: { email, role: auth.role, plan },
    create: {
      id: auth.userId,
      email,
      role: auth.role,
      passwordHash: 'test-hash',
      plan,
    },
  });
}
