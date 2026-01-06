import { z } from 'zod';

const EnvSchema = z.object({
  GRAPHQL_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),
});

export function getEnv() {
  const parsed = EnvSchema.safeParse({
    GRAPHQL_URL: process.env.GRAPHQL_URL ?? 'http://localhost:4000/graphql',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-me-please',
  });

  if (!parsed.success) {
    throw new Error(`Invalid env: ${parsed.error.message}`);
  }

  return parsed.data;
}
