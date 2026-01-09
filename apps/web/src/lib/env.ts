import { z } from 'zod';

const EnvSchema = z.object({
  GRAPHQL_URL: z.string().url(),
});

export function getEnv() {
  const parsed = EnvSchema.safeParse({
    GRAPHQL_URL: process.env.GRAPHQL_URL ?? 'http://localhost:3000/api/graphql',
  });

  if (!parsed.success) {
    throw new Error(`Invalid env: ${parsed.error.message}`);
  }

  return parsed.data;
}
