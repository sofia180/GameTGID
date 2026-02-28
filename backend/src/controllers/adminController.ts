import { Request, Response } from 'express';
import { pool } from '../db/pool.js';

export async function listParticipantsAdmin(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { rows } = await pool.query(
    `SELECT p.id, u.username, u.telegram_id, u.id as user_id
     FROM participants p JOIN users u ON u.id = p.user_id
     WHERE p.tournament_id=$1 ORDER BY p.id`,
    [id]
  );
  res.json({ participants: rows });
}

export async function listMatchesAdmin(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { rows } = await pool.query('SELECT * FROM matches WHERE tournament_id=$1 ORDER BY id', [id]);
  res.json({ matches: rows });
}
