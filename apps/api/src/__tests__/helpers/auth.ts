export type TestUserRole = 'MERCHANT' | 'OWNER';

export function makeTestUser(args: { userId?: string; role: TestUserRole }) {
  return {
    userId: args.userId ?? 'test-user',
    role: args.role,
  };
}
