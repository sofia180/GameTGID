import { pool } from '../db/pool.js';
import { User } from '../models/types.js';

export async function getUserById(id: number): Promise<User | null> {
  const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
  return rows[0] || null;
}

export async function adjustBalance(userId: number, delta: number) {
  const { rows } = await pool.query('UPDATE users SET balance = balance + $2 WHERE id=$1 RETURNING *', [userId, delta]);
  return rows[0] as User;
}
