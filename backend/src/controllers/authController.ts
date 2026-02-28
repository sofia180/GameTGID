import { Response } from 'express';
import { AuthedRequest } from '../middleware/telegramAuth.js';
import { signSocketToken } from '../utils/jwt.js';

export async function me(req: AuthedRequest, res: Response) {
  return res.json({ user: req.user });
}

export async function socketToken(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const token = signSocketToken({ userId: req.user.id });
  res.json({ token });
}
