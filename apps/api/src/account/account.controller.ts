import type { Request, Response } from 'express';
import { getRequestAuth } from '../auth/get-request-auth';
import { UserRepository } from '../repositories/user.repository';

export async function getAccountMe(req: Request, res: Response) {
  try {
    const auth = await getRequestAuth(req);

    if (!auth.userId || !auth.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRepo = new UserRepository();
    const user = await userRepo.getAccountForUser(auth.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ ok: true, user });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Failed to load account info' });
  }
}
