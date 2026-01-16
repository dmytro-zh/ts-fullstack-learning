import { SignJWT, jwtVerify } from 'jose';

type ReceiptTokenPayload = {
  orderId: string;
  email: string;
};

const RECEIPT_TOKEN_TTL = '24h';

function normalizeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function issueReceiptToken(input: ReceiptTokenPayload): Promise<string> {
  const secret = process.env.API_JWT_SECRET;
  if (!secret) {
    throw new Error('API_JWT_SECRET is missing');
  }

  return new SignJWT({ email: input.email, kind: 'receipt' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(input.orderId)
    .setIssuedAt()
    .setExpirationTime(RECEIPT_TOKEN_TTL)
    .sign(normalizeSecret(secret));
}

export async function verifyReceiptToken(token: string): Promise<ReceiptTokenPayload | null> {
  const secret = process.env.API_JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, normalizeSecret(secret));
    if (payload.kind !== 'receipt') return null;

    const orderId = typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
    const email = typeof payload.email === 'string' && payload.email.length > 0 ? payload.email : null;

    if (!orderId || !email) return null;
    return { orderId, email };
  } catch {
    return null;
  }
}
