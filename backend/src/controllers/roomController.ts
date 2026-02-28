import { Request, Response } from 'express';
import { pool } from '../db/pool.js';
import { randomUUID } from 'crypto';

export async function createRoom(req: Request, res: Response) {
  const matchId = Number(req.params.id);
  const code = randomUUID().slice(0, 8);
  const password = randomUUID().slice(0, 6);
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const { rows } = await pool.query(
    `INSERT INTO rooms (match_id, code, password, status, expires_at)
     VALUES ($1,$2,$3,'open',$4) RETURNING *`,
    [matchId, code, password, expires]
  );
  res.json({ room: rows[0] });
}

export async function getRoom(req: Request, res: Response) {
  const matchId = Number(req.params.id);
  const { rows } = await pool.query('SELECT * FROM rooms WHERE match_id=$1 ORDER BY id DESC LIMIT 1', [matchId]);
  if (!rows.length) return res.status(404).json({ error: 'Room not found' });
  res.json({ room: rows[0] });
}
