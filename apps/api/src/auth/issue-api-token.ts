import { SignJWT } from 'jose';
import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared';

function normalizeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

function isAppRole(value: unknown): value is AppRole {
  return (
    value === APP_ROLES.PLATFORM_OWNER ||
    value === APP_ROLES.MERCHANT ||
    value === APP_ROLES.BUYER
  );
}

export async function issueApiToken(input: {
  userId: string;
  email: string;
  role: AppRole;
}): Promise<string> {
  const secret = process.env.API_JWT_SECRET;
  if (!secret) {
    throw new Error('API_JWT_SECRET is missing');
  }

  const role = isAppRole(input.role) ? input.role : null;
  if (!role) {
    throw new Error('Invalid role for token');
  }

  return new SignJWT({ email: input.email, role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(normalizeSecret(secret));
}
