/**
 * @file Postgres SQL Connector
 * @description Implements the SqlConnector interface for PostgreSQL databases. Executes read-only
 *   queries with row limits and returns structured results with checksums.
 * @remarks All queries are validated by the SQL policy before reaching this connector.
 *   Never executes write operations. Connection pooling via pg.Pool.
 */

import pg from 'pg';
import { createHash } from 'node:crypto';
import type { SqlConnector, SqlQueryParams, SqlQueryResult } from '@crm-ai/shared';
import { ToolExecutionError } from '@crm-ai/shared';

/**
 * PostgreSQL connector implementing the SqlConnector interface.
 *
 * @example
 * ```ts
 * const connector = new PostgresConnector({ connectionString: 'postgresql://...' });
 * const result = await connector.query({ sql: 'SELECT ...', sourceId: '...', workspaceId: '...' });
 * await connector.disconnect();
 * ```
 */
export class PostgresConnector implements SqlConnector {
  private pool: pg.Pool;

  constructor(config: { connectionString: string } | pg.PoolConfig) {
    this.pool = new pg.Pool(config);
  }

  /**
   * Execute a read-only SQL query.
   *
   * @param params - Query parameters including sanitized SQL and limits.
   * @returns Structured query result with columns, rows, rowCount, and checksum.
   * @throws ToolExecutionError if the query fails.
   */
  async query(params: SqlQueryParams): Promise<SqlQueryResult> {
    const { sql, maxRows = 200 } = params;
    const client = await this.pool.connect();
    try {
      // Set statement timeout to prevent runaway queries
      await client.query('SET statement_timeout = 30000');
      // Force read-only transaction
      await client.query('SET default_transaction_read_only = ON');

      const result = await client.query(sql);

      const rows = result.rows.slice(0, maxRows);
      const columns = result.fields?.map((f) => f.name) ?? [];

      // Compute checksum for integrity
      const checksum = createHash('sha256')
        .update(JSON.stringify(rows))
        .digest('hex')
        .slice(0, 16);

      return {
        columns,
        rows,
        rowCount: rows.length,
        checksum,
        truncated: result.rows.length > maxRows,
      };
    } catch (err) {
      throw new ToolExecutionError(
        `SQL query failed: ${(err as Error).message}`,
        { sql, sourceId: params.sourceId },
      );
    } finally {
      // Reset read-only before releasing
      try {
        await client.query('RESET default_transaction_read_only');
      } catch {
        // Best effort
      }
      client.release();
    }
  }

  /**
   * Test the database connection.
   *
   * @returns Connection test result.
   */
  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1 AS connected');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    } finally {
      client.release();
    }
  }

  /** Disconnect and close the pool. */
  async disconnect(): Promise<void> {
    await this.pool.end();
  }
}
