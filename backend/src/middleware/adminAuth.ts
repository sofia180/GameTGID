import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.header('x-admin-key');
  if (!key || key !== env.adminApiKey) {
    return res.status(403).json({ error: 'Admin key required' });
  }
  next();
}
