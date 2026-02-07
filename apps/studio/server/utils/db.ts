/**
 * @file Database Client Utility
 * @description Provides a shared Postgres connection pool for server-side use. Uses runtime config
 *   for the connection string.
 * @remarks Only used in server/ directory. Never import from client-side code.
 */

import pg from 'pg';

let pool: pg.Pool | null = null;

/**
 * Get or create a shared Postgres connection pool.
 *
 * @param connectionString - Postgres connection string (from runtime config).
 * @returns A pg.Pool instance.
 */
export function getPool(connectionString: string): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

/**
 * Execute a parameterized query using the shared pool.
 *
 * @param connectionString - Postgres connection string.
 * @param sql - SQL query string with $1, $2, etc. placeholders.
 * @param params - Query parameters.
 * @returns Query result.
 */
export async function query(
  connectionString: string,
  sql: string,
  params: unknown[] = [],
): Promise<pg.QueryResult> {
  const p = getPool(connectionString);
  return p.query(sql, params);
}
