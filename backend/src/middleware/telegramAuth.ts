import { Request, Response, NextFunction } from 'express';
import { validateInitData } from '../utils/telegram.js';
import { pool } from '../db/pool.js';

export interface AuthedRequest extends Request {
  user?: { id: number; telegram_id: number; username?: string };
  initData?: Record<string, string>;
}

export async function telegramAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const initData = req.header('x-telegram-init-data');
  const { valid, data } = validateInitData(initData || '');
  if (!valid || !data) return res.status(401).json({ error: 'Invalid Telegram signature' });

  try {
    const userObj = data.user ? JSON.parse(data.user) : null;
    const telegramId = userObj?.id;
    if (!telegramId) return res.status(400).json({ error: 'Missing user id in initData' });

    const username = userObj?.username || userObj?.first_name;
    const result = await pool.query(
      'INSERT INTO users (telegram_id, username) VALUES ($1, $2) ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username RETURNING id, telegram_id, username',
      [telegramId, username]
    );
    req.user = result.rows[0];
    req.initData = data;
    next();
  } catch (err) {
    next(err);
  }
}
