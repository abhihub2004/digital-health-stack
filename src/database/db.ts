import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export async function testDatabaseConnection(): Promise<void> {
  const result = await pool.query('SELECT NOW() AS current_time');
  console.log('PostgreSQL connected:', result.rows[0].current_time);
}