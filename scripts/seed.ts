import { config } from 'dotenv';
import { Pool } from 'pg';
config({ path: './backend/.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  await pool.query(`INSERT INTO tournaments (title, entry_fee, prize_pool, status)
    VALUES ('Demo Cup', 0, 5, 'active'), ('TON Open', 1.5, 15, 'pending')
    ON CONFLICT DO NOTHING;`);
  console.log('Seeded tournaments');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
