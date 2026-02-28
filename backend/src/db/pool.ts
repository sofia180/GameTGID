import { Pool } from 'pg';
import { env } from '../config/env.js';

export const pool = new Pool({ connectionString: env.databaseUrl });

pool.on('error', (err) => {
  console.error('Unexpected PG error', err);
});

export async function migrate() {
  // idempotent schema creation for local/dev
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id BIGINT UNIQUE NOT NULL,
      username TEXT,
      balance NUMERIC DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS tournaments (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      entry_fee NUMERIC DEFAULT 0,
      prize_pool NUMERIC DEFAULT 0,
      status TEXT DEFAULT 'pending',
      game_type TEXT DEFAULT 'arcade',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
      UNIQUE(user_id, tournament_id)
    );
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
      player1 INTEGER REFERENCES users(id),
      player2 INTEGER REFERENCES users(id),
      winner INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      game_type TEXT DEFAULT 'arcade'
    );
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      token_symbol TEXT DEFAULT 'TON',
      memo TEXT UNIQUE NOT NULL,
      from_address TEXT,
      tx_hash TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      confirmed_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS payments_user_tournament_idx ON payments(user_id, tournament_id);
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
      code TEXT UNIQUE NOT NULL,
      password TEXT,
      status TEXT DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ
    );
  `);

  // Add columns if missing (idempotent)
  await pool.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='game_type') THEN
        ALTER TABLE tournaments ADD COLUMN game_type TEXT DEFAULT 'arcade';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='game_type') THEN
        ALTER TABLE matches ADD COLUMN game_type TEXT DEFAULT 'arcade';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='token_symbol') THEN
        ALTER TABLE payments ADD COLUMN token_symbol TEXT DEFAULT 'TON';
      END IF;
    END$$;`);
}
