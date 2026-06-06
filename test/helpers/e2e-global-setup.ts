import 'dotenv/config';
import { Pool } from 'pg';

export const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL ?? '';

let adminPool: Pool | null = null;

function getAdminUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = '/postgres';
  return url.toString();
}

export async function setup(): Promise<void> {
  if (!ORIGINAL_DATABASE_URL) {
    throw new Error('E2E: DATABASE_URL is not set. Check your .env file.');
  }

  const adminUrl = getAdminUrl(ORIGINAL_DATABASE_URL);
  adminPool = new Pool({ connectionString: adminUrl });

  try {
    await adminPool.query('SELECT 1');
  } catch (err) {
    throw new Error(
      `E2E: Cannot connect to PostgreSQL. Make sure the database is running: docker compose up -d\n${String(err)}`,
    );
  }
}

export async function teardown(): Promise<void> {
  if (!adminPool) return;

  try {
    const { rows } = await adminPool.query<{ datname: string }>(
      `SELECT datname FROM pg_database WHERE datname LIKE 'kafe_test_%'`,
    );

    for (const row of rows) {
      try {
        await adminPool.query(`DROP DATABASE IF EXISTS "${row.datname}" WITH (FORCE)`);
      } catch (err) {
        console.error(`E2E global teardown: failed to drop ${row.datname}:`, err);
      }
    }
  } finally {
    await adminPool.end();
    adminPool = null;
  }
}
