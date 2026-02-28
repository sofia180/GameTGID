import { pool } from '../db/pool.js';
import { Tournament } from '../models/types.js';
import { emitEvent } from '../utils/events.js';

export async function listTournaments(): Promise<Tournament[]> {
  const { rows } = await pool.query('SELECT * FROM tournaments ORDER BY created_at DESC');
  return rows;
}

export async function tournamentById(id: number): Promise<Tournament | null> {
  const { rows } = await pool.query('SELECT * FROM tournaments WHERE id=$1', [id]);
  return rows[0] || null;
}

export async function createTournament(input: { title: string; entry_fee: number; prize_pool: number; game_type: string }): Promise<Tournament> {
  const { rows } = await pool.query(
    'INSERT INTO tournaments (title, entry_fee, prize_pool, status, game_type) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [input.title, input.entry_fee, input.prize_pool, 'pending', input.game_type]
  );
  return rows[0];
}

export async function startTournament(id: number) {
  await pool.query('UPDATE tournaments SET status=$2 WHERE id=$1', [id, 'active']);
  emitEvent('tournament:updated', { tournamentId: id, status: 'active' });
}

export async function completeTournament(id: number) {
  await pool.query('UPDATE tournaments SET status=$2 WHERE id=$1', [id, 'completed']);
  emitEvent('tournament:updated', { tournamentId: id, status: 'completed' });
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

export async function listParticipants(tournamentId: number) {
  const { rows } = await pool.query(
    `SELECT p.id, u.username, u.telegram_id, u.id as user_id
     FROM participants p JOIN users u ON u.id = p.user_id
     WHERE p.tournament_id=$1
     ORDER BY p.id`,
    [tournamentId]
  );
  return rows;
}

export async function listMatches(tournamentId: number) {
  const { rows } = await pool.query(
    'SELECT * FROM matches WHERE tournament_id=$1 ORDER BY id',
    [tournamentId]
  );
  return rows;
}
