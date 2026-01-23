import { APP_ROLES, APP_PLANS } from '@ts-fullstack-learning/shared';
import { prisma } from '../lib/prisma';
import { issueApiToken } from './issue-api-token';
import { hashPassword, verifyPassword } from './password';
import { AUTH_ERROR_CODES, AuthError } from './auth.errors';
import {
  loginInputSchema,
  registerInputSchema,
  type LoginInput,
  type RegisterInput,
} from './auth.validation';

const userSelect = { id: true, email: true, role: true, passwordHash: true };

export async function registerUser(input: RegisterInput): Promise<{ token: string }> {
  const parsed = registerInputSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { email: parsed.email },
    select: { id: true },
  });

  if (existing) {
    throw new AuthError(AUTH_ERROR_CODES.EMAIL_TAKEN, 'Email already registered');
  }

  const passwordHash = await hashPassword(parsed.password);

  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      role: APP_ROLES.BUYER,
      passwordHash,
    },
    select: { id: true, email: true, role: true },
  });

  const token = await issueApiToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { token };
}

export async function registerMerchant(
  input: RegisterInput,
): Promise<{ token: string; userId: string }> {
  const parsed = registerInputSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { email: parsed.email },
    select: { id: true },
  });

  if (existing) {
    throw new AuthError(AUTH_ERROR_CODES.EMAIL_TAKEN, 'Email already registered');
  }

  const passwordHash = await hashPassword(parsed.password);

  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      role: APP_ROLES.MERCHANT,
      plan: APP_PLANS.FREE,
      passwordHash,
    },
    select: { id: true, email: true, role: true },
  });

  const token = await issueApiToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { token, userId: user.id };
}

export async function loginUser(input: LoginInput): Promise<{ token: string }> {
  const parsed = loginInputSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: parsed.email },
    select: userSelect,
  });

  if (!user) {
    throw new AuthError(AUTH_ERROR_CODES.INVALID_CREDENTIALS, 'Invalid credentials');
  }

  const ok = await verifyPassword(parsed.password, user.passwordHash);
  if (!ok) {
    throw new AuthError(AUTH_ERROR_CODES.INVALID_CREDENTIALS, 'Invalid credentials');
  }

  const token = await issueApiToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { token };
}
