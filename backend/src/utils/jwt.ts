import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signSocketToken(payload: { userId: number }) {
  return jwt.sign(payload, env.wsSecret, { expiresIn: '2h' });
}

export function verifySocketToken(token: string): { userId: number } {
  const decoded = jwt.verify(token, env.wsSecret) as any;
  return { userId: decoded.userId };
}
