import { Response } from 'express';
import { AuthedRequest } from '../middleware/telegramAuth.js';

export async function me(req: AuthedRequest, res: Response) {
  return res.json({ user: req.user });
}
