import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AuthError, AUTH_ERROR_CODES } from './auth.errors';
import { registerMerchant } from './auth.service';
import { prisma } from '../lib/prisma';

export async function registerMerchantHandler(req: Request, res: Response) {
  try {
    const inviteCode = typeof req.body?.inviteCode === 'string' ? req.body.inviteCode.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!inviteCode) {
      return res.status(403).json({ error: 'Invite code is required' });
    }

    const invite = await prisma.merchantInvite.findUnique({
      where: { code: inviteCode },
    });

    if (!invite) {
      return res.status(403).json({ error: 'Invalid invite code' });
    }

    if (invite.usedAt) {
      return res.status(403).json({ error: 'Invite code already used' });
    }

    if (invite.email && invite.email.toLowerCase() !== email) {
      return res.status(403).json({ error: 'Invite code does not match email' });
    }

    const { token, userId } = await registerMerchant({
      email: req.body?.email,
      password: req.body?.password,
    });

    await prisma.merchantInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedByUserId: userId },
    });

    return res.status(201).json({ token });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.issues });
    }

    if (err instanceof AuthError && err.code === AUTH_ERROR_CODES.EMAIL_TAKEN) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Failed to register merchant' });
  }
}
