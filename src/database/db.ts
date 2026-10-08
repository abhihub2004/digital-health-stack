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
 * Detect the old AI Studio demo/seed accounts.
 *
 * The previous version of the application contained these accounts:
 * - Arun Kumar
 * - Dr. Rahul Sharma
 * - Dr. Ananya Rao
 * - Dr. Priya Nair
 * - Dr. Arjun Kumar
 * - Apex Diagnostic Centre
 * - CityMed Central Pharmacy
 * - System Super Administrator
 *
 * We only perform the automatic cleanup when ALL existing users
 * belong to this known legacy seed set.
 *
 * This prevents accidentally deleting real users if the database
 * already contains newly registered accounts.
 */
function isLegacySeedState(state: any): boolean {
  if (!state || !Array.isArray(state.users)) {
    return false;
  }

  const legacyUserIds = new Set([
    'user_patient_1',
    'user_doc_rahul',
    'user_doc_ananya',
    'user_doc_priya',
    'user_doc_arjun',
    'user_lab_apex',
    'user_pharmacy_citymed',
    'user_admin',
  ]);

  const users = state.users;

  if (users.length === 0) {
    return false;
  }

  return users.every((user: any) => legacyUserIds.has(user?.id));
}

/**
 * Load the complete application state from PostgreSQL.
 *
 * Behaviour:
 * 1. If PostgreSQL has no application state, save the supplied
 *    clean fallback state.
 *
 * 2. If PostgreSQL contains only the old AI Studio demo accounts,
 *    replace that legacy state with the supplied clean fallback state.
 *
 * 3. If PostgreSQL contains real/new users, preserve the existing
 *    application state.
 */
export async function loadAppState<T>(fallbackState: T): Promise<T> {
  const result = await pool.query(
    'SELECT data FROM app_state WHERE id = 1 LIMIT 1'
  );

  if (result.rows.length > 0) {
    const storedState = result.rows[0].data as any;

    if (isLegacySeedState(storedState)) {
      console.log(
        'Legacy AI Studio demo data detected. Replacing it with clean application state.'
      );

      await pool.query(
        `UPDATE app_state
         SET data = $1::jsonb,
             updated_at = NOW()
         WHERE id = 1`,
        [JSON.stringify(fallbackState)]
      );

      console.log(
        'Legacy demo accounts removed successfully. Database now starts clean.'
      );

      return fallbackState;
    }

    console.log('Application state loaded from PostgreSQL.');

    return storedState as T;
  }

  await pool.query(
    `INSERT INTO app_state (id, data, updated_at)
     VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(fallbackState)]
  );

  console.log('Initial clean application state saved to PostgreSQL.');

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