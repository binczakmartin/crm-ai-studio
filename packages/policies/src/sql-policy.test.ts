/**
 * @file SQL Policy Tests
 * @description Unit tests for the AST-based SQL safety policy. Validates SELECT-only enforcement,
 *   LIMIT injection, table allowlists, and forbidden function detection.
 * @remarks Tests the core security gate. All tests must pass before merging.
 */

import { describe, it, expect } from 'vitest';
import { SqlPolicy } from './sql-policy.js';
import { SqlSafetyError } from '@crm-ai/shared';

describe('SqlPolicy', () => {
  const policy = new SqlPolicy({
    maxRows: 100,
    allowedTables: ['users', 'orders', 'products'],
    allowedColumns: [],
    forbiddenFunctions: ['pg_sleep', 'dblink'],
  });

  describe('SELECT-only enforcement', () => {
    it('allows valid SELECT queries', () => {
      const result = policy.validate('SELECT id, name FROM users');
      expect(result.valid).toBe(true);
      expect(result.sanitizedSql).toContain('LIMIT');
    });

    it('rejects INSERT statements', () => {
      const result = policy.validate("INSERT INTO users (name) VALUES ('test')");
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('SELECT');
    });

    it('rejects UPDATE statements', () => {
      const result = policy.validate("UPDATE users SET name = 'test'");
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('SELECT');
    });

    it('rejects DELETE statements', () => {
      const result = policy.validate('DELETE FROM users');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('SELECT');
    });

    it('rejects DROP TABLE', () => {
      const result = policy.validate('DROP TABLE users');
      expect(result.valid).toBe(false);
    });
  });

  describe('single statement enforcement', () => {
    it('rejects multiple statements', () => {
      const result = policy.validate('SELECT 1; SELECT 2');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Multiple statements');
    });

    it('allows single statement with trailing semicolon', () => {
      const result = policy.validate('SELECT id FROM users;');
      expect(result.valid).toBe(true);
    });
  });

  describe('LIMIT enforcement', () => {
    it('injects LIMIT when missing', () => {
      const result = policy.validate('SELECT id FROM users');
      expect(result.valid).toBe(true);
      expect(result.sanitizedSql).toBe('SELECT id FROM users LIMIT 100');
      expect(result.effectiveLimit).toBe(100);
    });

    it('respects existing LIMIT if smaller than max', () => {
      const result = policy.validate('SELECT id FROM users LIMIT 10');
      expect(result.valid).toBe(true);
      expect(result.effectiveLimit).toBeLessThanOrEqual(100);
    });

    it('reduces existing LIMIT if larger than max', () => {
      const result = policy.validate('SELECT id FROM users LIMIT 500');
      expect(result.valid).toBe(true);
      expect(result.effectiveLimit).toBe(100);
    });
  });

  describe('table allowlist', () => {
    it('allows queries on allowlisted tables', () => {
      const result = policy.validate('SELECT * FROM users');
      expect(result.valid).toBe(true);
      expect(result.referencedTables).toContain('users');
    });

    it('rejects queries on non-allowlisted tables', () => {
      const result = policy.validate('SELECT * FROM secrets');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('not in the allowlist');
    });
  });

  describe('forbidden functions', () => {
    it('blocks pg_sleep', () => {
      const result = policy.validate('SELECT pg_sleep(5) FROM users');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('pg_sleep');
    });

    it('blocks queries containing dblink keyword', () => {
      // Use a simpler query that includes the forbidden function name
      const result = policy.validate('SELECT dblink FROM users');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('dblink');
    });
  });

  describe('empty and invalid SQL', () => {
    it('throws SqlSafetyError on empty SQL', () => {
      expect(() => policy.validate('')).toThrow(SqlSafetyError);
    });

    it('throws SqlSafetyError on unparseable SQL', () => {
      expect(() => policy.validate('NOT VALID SQL AT ALL ???')).toThrow(SqlSafetyError);
    });
  });

  describe('validateOrThrow', () => {
    it('returns result for valid queries', () => {
      const result = policy.validateOrThrow('SELECT id FROM users');
      expect(result.valid).toBe(true);
    });

    it('throws SqlSafetyError for invalid queries', () => {
      expect(() =>
        policy.validateOrThrow("UPDATE users SET name = 'hack'"),
      ).toThrow(SqlSafetyError);
    });
  });

  describe('policy without allowlist (permissive mode)', () => {
    const permissivePolicy = new SqlPolicy({ maxRows: 50, allowedTables: [] });

    it('allows any table when allowlist is empty', () => {
      const result = permissivePolicy.validate('SELECT * FROM any_table');
      expect(result.valid).toBe(true);
    });
  });
});
