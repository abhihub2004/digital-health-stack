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

/**
 * Load the complete application state from PostgreSQL.
 * If no state exists yet, store the supplied seed data.
 */
export async function loadAppState<T>(fallbackState: T): Promise<T> {
  const result = await pool.query(
    'SELECT data FROM app_state WHERE id = 1 LIMIT 1'
  );

  if (result.rows.length > 0) {
    console.log('Application state loaded from PostgreSQL.');
    return result.rows[0].data as T;
  }

  await pool.query(
    `INSERT INTO app_state (id, data)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(fallbackState)]
  );

  console.log('Initial application state saved to PostgreSQL.');
  return fallbackState;
}

/**
 * Save the complete application state to PostgreSQL.
 */
export async function saveAppState<T>(state: T): Promise<void> {
  await pool.query(
    `INSERT INTO app_state (id, data, updated_at)
     VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id)
     DO UPDATE SET
       data = EXCLUDED.data,
       updated_at = NOW()`,
    [JSON.stringify(state)]
  );
}