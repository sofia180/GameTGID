import { pool } from '../db/pool.js';
import { Match } from '../models/types.js';
import { emitEvent } from '../utils/events.js';

export async function pairPlayers(tournamentId: number): Promise<Match[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT p.user_id FROM participants p
       WHERE p.tournament_id=$1 AND NOT EXISTS (
         SELECT 1 FROM matches m WHERE m.tournament_id=$1 AND (m.player1=p.user_id OR m.player2=p.user_id) AND m.status <> 'completed'
       )
       ORDER BY p.id`,
      [tournamentId]
    );

    const matches: Match[] = [];
    for (let i = 0; i < rows.length - 1; i += 2) {
      const p1 = rows[i].user_id;
      const p2 = rows[i + 1].user_id;
      const inserted = await client.query(
        'INSERT INTO matches (tournament_id, player1, player2, status) VALUES ($1,$2,$3,$4) RETURNING *',
        [tournamentId, p1, p2, 'pending']
      );
      matches.push(inserted.rows[0]);
      emitEvent('match:created', { tournamentId, matchId: inserted.rows[0].id });
    }
    await client.query('COMMIT');
    return matches;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
