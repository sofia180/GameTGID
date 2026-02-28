import { pool } from '../db/pool.js';
import { Match } from '../models/types.js';
import { emitEvent } from '../utils/events.js';

export async function reportResult(matchId: number, winnerId: number): Promise<Match> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM matches WHERE id=$1', [matchId]);
    if (!rows.length) throw new Error('Match not found');
    const match = rows[0];
    if (match.status === 'completed') throw new Error('Already completed');
    if (winnerId !== match.player1 && winnerId !== match.player2) throw new Error('Winner not in match');

    const updated = await client.query(
      'UPDATE matches SET winner=$2, status=$3 WHERE id=$1 RETURNING *',
      [matchId, winnerId, 'completed']
    );
    await client.query('COMMIT');
    emitEvent('match:updated', { tournamentId: match.tournament_id, matchId, winnerId });
    return updated.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getLeaderboard(tournamentId: number) {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, COUNT(m.id) AS wins
     FROM users u
     JOIN matches m ON m.winner = u.id
     WHERE m.tournament_id = $1
     GROUP BY u.id, u.username
     ORDER BY wins DESC, u.username ASC`,
    [tournamentId]
  );
  return rows;
}
