import { pool } from '../db/pool.js';
import { Tournament } from '../models/types.js';

export async function listTournaments(): Promise<Tournament[]> {
  const { rows } = await pool.query('SELECT * FROM tournaments ORDER BY created_at DESC');
  return rows;
}

export async function createTournament(input: { title: string; entry_fee: number; prize_pool: number }): Promise<Tournament> {
  const { rows } = await pool.query(
    'INSERT INTO tournaments (title, entry_fee, prize_pool, status) VALUES ($1,$2,$3,$4) RETURNING *',
    [input.title, input.entry_fee, input.prize_pool, 'pending']
  );
  return rows[0];
}

export async function startTournament(id: number) {
  await pool.query('UPDATE tournaments SET status=$2 WHERE id=$1', [id, 'active']);
}

export async function completeTournament(id: number) {
  await pool.query('UPDATE tournaments SET status=$2 WHERE id=$1', [id, 'completed']);
}

export async function joinTournament(tournamentId: number, userId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tournament = await client.query('SELECT * FROM tournaments WHERE id=$1', [tournamentId]);
    if (!tournament.rowCount) throw new Error('Tournament not found');
    const status = tournament.rows[0].status;
    if (status === 'completed' || status === 'cancelled') throw new Error('Tournament closed');

    const joined = await client.query('SELECT 1 FROM participants WHERE user_id=$1 AND tournament_id=$2', [userId, tournamentId]);
    if (joined.rowCount) throw new Error('Already joined');

    await client.query('INSERT INTO participants (user_id, tournament_id) VALUES ($1,$2)', [userId, tournamentId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function participantCount(tournamentId: number): Promise<number> {
  const { rows } = await pool.query('SELECT COUNT(*) FROM participants WHERE tournament_id=$1', [tournamentId]);
  return parseInt(rows[0].count, 10);
}
