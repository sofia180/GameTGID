import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AuthedRequest } from '../middleware/telegramAuth.js';
import { pool } from '../db/pool.js';

async function getOrCreateCasualTournament() {
  const title = 'Casual Chess';
  const found = await pool.query('SELECT id FROM tournaments WHERE title=$1 LIMIT 1', [title]);
  if (found.rowCount) return found.rows[0].id as number;
  const created = await pool.query(
    'INSERT INTO tournaments (title, entry_fee, prize_pool, status, game_type) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [title, 0, 0, 'active', 'chess']
  );
  return created.rows[0].id as number;
}

export async function createCasual(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const tournamentId = await getOrCreateCasualTournament();
  const invite = randomUUID().slice(0, 6).toUpperCase();
  const { rows } = await pool.query(
    `INSERT INTO matches (tournament_id, player1, status, game_type, invite_code)
     VALUES ($1,$2,'pending','chess',$3) RETURNING *`,
    [tournamentId, req.user.id, invite]
  );
  res.json({ code: invite, match: rows[0] });
}

export async function joinCasual(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'code required' });
  const { rows } = await pool.query('SELECT * FROM matches WHERE invite_code=$1', [code]);
  if (!rows.length) return res.status(404).json({ error: 'Invite not found' });
  const match = rows[0];
  if (match.player2 && match.player2 !== req.user.id) return res.status(400).json({ error: 'Room full' });
  const updated = await pool.query('UPDATE matches SET player2=$2, status=$3 WHERE id=$1 RETURNING *', [match.id, req.user.id, 'pending']);
  res.json({ match: updated.rows[0] });
}
