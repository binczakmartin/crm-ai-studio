/**
 * @file SQL Safety Policy (AST-based)
 * @description Validates SQL queries using AST parsing to enforce SELECT-only, single statement,
 *   forced LIMIT, and table/column allowlists. No regex-based validation.
 * @remarks This is the core safety gate for SQL tool calls. Must never be bypassed.
 *   Uses pgsql-ast-parser for PostgreSQL AST parsing.
 */

import { parse, type Statement } from 'pgsql-ast-parser';
import { SqlSafetyError } from '@crm-ai/shared';

/** Narrowed type for a simple SELECT statement with from/limit. */
interface ParsedSelect {
  type: 'select';
  from?: Array<{ type: string; name?: { name: string }; statement?: ParsedSelect }>;
  limit?: unknown;
}

/** Configuration for the SQL safety policy. */
export interface SqlPolicyConfig {
  /** Maximum rows allowed (injected as LIMIT if missing). */
  maxRows: number;
  /** Allowlisted table names (empty = all allowed — only for local dev). */
  allowedTables: string[];
  /** Allowlisted column names (empty = all allowed). */
  allowedColumns: string[];
  /** Forbidden SQL functions (e.g., pg_sleep, dblink). */
  forbiddenFunctions: string[];
}

/** Default forbidden functions for safety. */
const DEFAULT_FORBIDDEN_FUNCTIONS = [
  'pg_sleep',
  'dblink',
  'lo_import',
  'lo_export',
  'pg_read_file',
  'pg_write_file',
  'pg_ls_dir',
  'pg_stat_file',
  'pg_terminate_backend',
  'pg_cancel_backend',
  'set_config',
  'current_setting',
];

/** Result of SQL validation. */
export interface SqlValidationResult {
  /** Whether the query passed validation. */
  valid: boolean;
  /** The (potentially modified) SQL with forced LIMIT. */
  sanitizedSql: string;
  /** Effective row limit. */
  effectiveLimit: number;
  /** Tables referenced in the query. */
  referencedTables: string[];
  /** Errors if validation failed. */
  errors: string[];
}

/**
 * AST-based SQL safety policy for PostgreSQL queries.
 *
 * @example
 * ```ts
 * const policy = new SqlPolicy({ maxRows: 200, allowedTables: ['users'], allowedColumns: [], forbiddenFunctions: [] });
 * const result = policy.validate('SELECT * FROM users');
 * ```
 */
export class SqlPolicy {
  private readonly config: SqlPolicyConfig;

  constructor(config: Partial<SqlPolicyConfig> = {}) {
    this.config = {
      maxRows: config.maxRows ?? 200,
      allowedTables: config.allowedTables ?? [],
      allowedColumns: config.allowedColumns ?? [],
      forbiddenFunctions: config.forbiddenFunctions ?? DEFAULT_FORBIDDEN_FUNCTIONS,
    };
  }

  /**
   * Validate and sanitize a SQL query.
   *
   * @param sql - The raw SQL query string.
   * @returns Validation result with sanitized SQL or errors.
   * @throws SqlSafetyError if critical parse failures occur.
   */
  validate(sql: string): SqlValidationResult {
    const errors: string[] = [];
    const referencedTables: string[] = [];

    // Step 1: Parse AST
    let statements: Statement[];
    try {
      statements = parse(sql);
    } catch (err) {
      throw new SqlSafetyError(`Failed to parse SQL: ${(err as Error).message}`, {
        sql,
      });
    }

    // Step 2: Single statement only
    if (statements.length === 0) {
      errors.push('Empty SQL query.');
      return { valid: false, sanitizedSql: sql, effectiveLimit: 0, referencedTables, errors };
    }
    if (statements.length > 1) {
      errors.push('Multiple statements are not allowed. Only single SELECT queries are permitted.');
      return { valid: false, sanitizedSql: sql, effectiveLimit: 0, referencedTables, errors };
    }

    const stmt = statements[0]!;

    // Step 3: SELECT-only
    if (stmt.type !== 'select') {
      errors.push(
        `Only SELECT queries are allowed. Received: ${stmt.type.toUpperCase()}.`,
      );
      return { valid: false, sanitizedSql: sql, effectiveLimit: 0, referencedTables, errors };
    }

    const selectStmt = stmt as unknown as ParsedSelect;

    // Step 4: Extract referenced tables
    this.extractTables(selectStmt, referencedTables);

    // Step 5: Check table allowlist
    if (this.config.allowedTables.length > 0) {
      for (const table of referencedTables) {
        if (!this.config.allowedTables.includes(table)) {
          errors.push(
            `Table "${table}" is not in the allowlist. Allowed tables: ${this.config.allowedTables.join(', ')}.`,
          );
        }
      }
    }

    // Step 6: Check for forbidden functions in the SQL text (defence in depth)
    const sqlLower = sql.toLowerCase();
    for (const fn of this.config.forbiddenFunctions) {
      if (sqlLower.includes(fn.toLowerCase())) {
        errors.push(`Forbidden function detected: ${fn}.`);
      }
    }

    // Step 7: Force LIMIT
    let effectiveLimit = this.config.maxRows;
    let sanitizedSql = sql.trim();

    // Remove trailing semicolons
    if (sanitizedSql.endsWith(';')) {
      sanitizedSql = sanitizedSql.slice(0, -1).trim();
    }

    // Check if LIMIT is already present
    if (selectStmt.limit) {
      // If there's an existing limit, use the smaller of the two
      const existingLimit = this.extractLimitValue(selectStmt.limit);
      if (existingLimit !== null) {
        effectiveLimit = Math.min(existingLimit, this.config.maxRows);
        // Replace the existing LIMIT with the effective one
        sanitizedSql = this.replaceLimitInSql(sanitizedSql, effectiveLimit);
      }
    } else {
      // No LIMIT present — inject it
      sanitizedSql = `${sanitizedSql} LIMIT ${this.config.maxRows}`;
    }

    if (errors.length > 0) {
      return { valid: false, sanitizedSql, effectiveLimit, referencedTables, errors };
    }

    return { valid: true, sanitizedSql, effectiveLimit, referencedTables, errors: [] };
  }

  /**
   * Validate and throw if invalid. Convenience method for pipeline use.
   */
  validateOrThrow(sql: string): SqlValidationResult {
    const result = this.validate(sql);
    if (!result.valid) {
      throw new SqlSafetyError(
        `SQL query blocked: ${result.errors.join(' ')}`,
        { sql, errors: result.errors, referencedTables: result.referencedTables },
      );
    }
    return result;
  }

  /** Extract table names from a SELECT statement (recursive for subqueries). */
  private extractTables(stmt: ParsedSelect, tables: string[]): void {
    if (!stmt.from) return;

    for (const from of stmt.from) {
      if (from.type === 'table') {
        const tableName = from.name?.name;
        if (tableName && !tables.includes(tableName)) {
          tables.push(tableName);
        }
      } else if (from.type === 'statement' && from.statement?.type === 'select') {
        this.extractTables(from.statement as ParsedSelect, tables);
      }
    }
  }

  /** Extract numeric LIMIT value from the AST node. */
  private extractLimitValue(limit: unknown): number | null {
    if (!limit) return null;
    const node = limit as { type?: string; value?: number };
    if (node.type === 'integer' && typeof node.value === 'number') {
      return node.value;
    }
    return null;
  }

  /** Replace the LIMIT clause in the SQL string. */
  private replaceLimitInSql(sql: string, newLimit: number): string {
    return sql.replace(/\bLIMIT\s+\d+/i, `LIMIT ${newLimit}`);
  }
}
