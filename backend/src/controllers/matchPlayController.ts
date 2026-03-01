import { Request, Response } from 'express';
import { Chess } from 'chess.js';
import { pool } from '../db/pool.js';
import { AuthedRequest } from '../middleware/telegramAuth.js';
import { emitEvent } from '../utils/events.js';

function ensurePlayerAccess(row: any, userId: number) {
  if (row.player1 !== userId && row.player2 !== userId) {
    const err: any = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
}

export async function myMatches(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { rows } = await pool.query(
    'SELECT * FROM matches WHERE player1=$1 OR player2=$1 ORDER BY id DESC',
    [req.user.id]
  );
  res.json({ matches: rows });
}

export async function matchState(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const matchId = Number(req.params.id);
  const { rows } = await pool.query('SELECT * FROM matches WHERE id=$1', [matchId]);
  if (!rows.length) return res.status(404).json({ error: 'Match not found' });
  const match = rows[0];
  ensurePlayerAccess(match, req.user.id);
  if (match.game_type !== 'chess') return res.status(400).json({ error: 'Only chess supported in play view' });

  let fen = match.state || new Chess().fen();
  if (!match.state) {
    await pool.query('UPDATE matches SET state=$2, status=$3 WHERE id=$1', [matchId, fen, 'in_progress']);
  }
  res.json({ fen, match });
}

export async function move(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const matchId = Number(req.params.id);
  const { from, to, promotion } = req.body || {};
  const { rows } = await pool.query('SELECT * FROM matches WHERE id=$1', [matchId]);
  if (!rows.length) return res.status(404).json({ error: 'Match not found' });
  const match = rows[0];
  ensurePlayerAccess(match, req.user.id);
  if (match.game_type !== 'chess') return res.status(400).json({ error: 'Only chess supported' });
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });

  const chess = new Chess(match.state || undefined);
  // turn check
  const isWhite = match.player1 === req.user.id;
  if ((isWhite && chess.turn() !== 'w') || (!isWhite && chess.turn() !== 'b')) {
    return res.status(400).json({ error: 'Not your turn' });
  }
  const result = chess.move({ from, to, promotion });
  if (!result) return res.status(400).json({ error: 'Illegal move' });

  let winner = null;
  let status = 'in_progress';
  if (chess.isCheckmate()) {
    winner = isWhite ? match.player1 : match.player2;
    status = 'completed';
  } else if (chess.isDraw() || chess.isStalemate()) {
    status = 'completed';
  }

  const fen = chess.fen();
  await pool.query(
    'UPDATE matches SET state=$2, winner=$3, status=$4 WHERE id=$1',
    [matchId, fen, winner, status]
  );
  emitEvent('match:updated', { tournamentId: match.tournament_id, matchId, winnerId: winner || undefined });
  res.json({ fen, status, winner });
}
