import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../src/database/db';

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Migration cannot continue.');
    process.exitCode = 1;
    return;
  }

  try {
    const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
    const schema = await readFile(schemaPath, 'utf8');

    console.log('Running PostgreSQL schema migration...');

    await pool.query(schema);

    console.log('PostgreSQL schema migration completed successfully.');
  } catch (error) {
    console.error('PostgreSQL schema migration failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();