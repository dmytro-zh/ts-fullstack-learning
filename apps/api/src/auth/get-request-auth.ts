import type express from 'express';
import { jwtVerify } from 'jose';
import { APP_ROLES, type AppRole } from '@ts-fullstack-learning/shared';

export type RequestAuth = {
  userId: string | null;
  role: AppRole | null;
};

function parseBearerToken(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;

  const value = Array.isArray(header) ? header[0] : header;
  const [scheme, token] = value.split(' ');
  if (scheme?.toLowerCase() !== 'bearer') return null;
  if (!token) return null;

  return token.trim();
}

function normalizeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

function isAppRole(value: unknown): value is AppRole {
  return (
    value === APP_ROLES.PLATFORM_OWNER || value === APP_ROLES.MERCHANT || value === APP_ROLES.BUYER
  );
}

export async function getRequestAuth(req: express.Request): Promise<RequestAuth> {
  const token = parseBearerToken(req);
  if (!token) return { userId: null, role: null };

  const secret = process.env.API_JWT_SECRET;
  if (!secret) return { userId: null, role: null };

  try {
    const { payload } = await jwtVerify(token, normalizeSecret(secret));

    const userId = typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
    const roleRaw = payload.role;
    const role = isAppRole(roleRaw) ? roleRaw : null;

    return { userId, role };
  } catch {
    return { userId: null, role: null };
  }
}
