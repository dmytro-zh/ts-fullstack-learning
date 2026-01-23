import type { Request, Response } from 'express';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { getRequestAuth } from '../auth/get-request-auth';
import { UserRepository } from '../repositories/user.repository';

export async function getBillingMe(req: Request, res: Response) {
  try {
    const auth = await getRequestAuth(req);

    if (!auth.userId || !auth.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (auth.role !== APP_ROLES.MERCHANT && auth.role !== APP_ROLES.PLATFORM_OWNER) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userRepo = new UserRepository();
    const billing = await userRepo.getBillingForUser(auth.userId);

    if (!billing) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ ok: true, ...billing });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Failed to load billing status' });
  }
}
