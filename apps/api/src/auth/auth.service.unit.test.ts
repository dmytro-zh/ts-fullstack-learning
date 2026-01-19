import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { AuthError, AUTH_ERROR_CODES } from './auth.errors';

vi.mock('../lib/prisma', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

vi.mock('./password', () => {
  return {
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
  };
});

import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from './password';
import { loginUser, registerUser } from './auth.service';

const prismaUser = prisma.user as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};

describe('auth.service', () => {
  beforeEach(() => {
    process.env.API_JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  it('registerUser creates a BUYER and returns token', async () => {
    prismaUser.findUnique.mockResolvedValueOnce(null);
    (hashPassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce('hashed-pass');
    prismaUser.create.mockResolvedValueOnce({
      id: 'u1',
      email: 'buyer@example.com',
      role: APP_ROLES.BUYER,
    });

    const res = await registerUser({
      email: 'Buyer@Example.com',
      password: 'StrongPass1!',
    });

    expect(prismaUser.findUnique).toHaveBeenCalledWith({
      where: { email: 'buyer@example.com' },
      select: { id: true },
    });

    expect(prismaUser.create).toHaveBeenCalledWith({
      data: {
        email: 'buyer@example.com',
        role: APP_ROLES.BUYER,
        passwordHash: 'hashed-pass',
      },
      select: { id: true, email: true, role: true },
    });

    expect(res.token).toEqual(expect.any(String));
  });

  it('registerUser throws when email already exists', async () => {
    prismaUser.findUnique.mockResolvedValueOnce({ id: 'u1' });

    await expect(
      registerUser({
        email: 'buyer@example.com',
        password: 'StrongPass1!',
      }),
    ).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.EMAIL_TAKEN,
    });
  });

  it('registerUser rejects weak password', async () => {
    await expect(
      registerUser({
        email: 'buyer@example.com',
        password: 'weak',
      }),
    ).rejects.toBeTruthy();
  });

  it('registerUser rejects invalid email', async () => {
    await expect(
      registerUser({
        email: 'not-an-email',
        password: 'StrongPass1!',
      }),
    ).rejects.toBeTruthy();

    expect(prismaUser.findUnique).not.toHaveBeenCalled();
  });

  it('loginUser normalizes email before lookup', async () => {
    prismaUser.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'buyer@example.com',
      role: APP_ROLES.BUYER,
      passwordHash: 'hashed',
    });

    (verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

    await loginUser({
      email: ' Buyer@Example.com ',
      password: 'StrongPass1!',
    });

    expect(prismaUser.findUnique).toHaveBeenCalledWith({
      where: { email: 'buyer@example.com' },
      select: { id: true, email: true, role: true, passwordHash: true },
    });
  });

  it('loginUser throws INVALID_CREDENTIALS when user not found', async () => {
    prismaUser.findUnique.mockResolvedValueOnce(null);

    await expect(
      loginUser({
        email: 'buyer@example.com',
        password: 'StrongPass1!',
      }),
    ).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    });
  });

  it('loginUser throws INVALID_CREDENTIALS when password does not match', async () => {
    prismaUser.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'buyer@example.com',
      role: APP_ROLES.BUYER,
      passwordHash: 'hashed',
    });

    (verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    await expect(
      loginUser({
        email: 'buyer@example.com',
        password: 'StrongPass1!',
      }),
    ).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    });
  });

  it('loginUser returns token when password matches', async () => {
    prismaUser.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'buyer@example.com',
      role: APP_ROLES.BUYER,
      passwordHash: 'hashed',
    });

    (verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

    const res = await loginUser({
      email: 'buyer@example.com',
      password: 'StrongPass1!',
    });

    expect(res.token).toEqual(expect.any(String));
  });
});
