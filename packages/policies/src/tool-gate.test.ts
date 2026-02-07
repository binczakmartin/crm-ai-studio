/**
 * @file Tool Gate Tests
 * @description Unit tests for tool gating: allowlists, max tool calls, and timeout configuration.
 * @remarks Tests the tool permission enforcement layer.
 */

import { describe, it, expect } from 'vitest';
import { ToolGate } from './tool-gate.js';
import { PolicyBlockedError } from '@crm-ai/shared';

describe('ToolGate', () => {
  const gate = new ToolGate({
    allowedTools: ['sql.query', 'rag.search'],
    toolTimeoutMs: 15_000,
    maxToolCallsPerPlan: 5,
  });

  it('allows permitted tools', () => {
    expect(() =>
      gate.validateActions([
        { tool: 'sql.query', args: { sql: 'SELECT 1' } },
        { tool: 'rag.search', args: { query: 'test' } },
      ]),
    ).not.toThrow();
  });

  it('blocks unpermitted tools', () => {
    expect(() =>
      gate.validateActions([{ tool: 'shell.exec', args: { cmd: 'rm -rf /' } }]),
    ).toThrow(PolicyBlockedError);
  });

  it('blocks plans exceeding max tool calls', () => {
    const actions = Array.from({ length: 6 }, (_, i) => ({
      tool: 'sql.query',
      args: { sql: `SELECT ${i}` },
    }));
    expect(() => gate.validateActions(actions)).toThrow(PolicyBlockedError);
  });

  it('returns configured timeout', () => {
    expect(gate.getTimeoutMs()).toBe(15_000);
  });

  describe('permissive mode (empty allowlist)', () => {
    const permissiveGate = new ToolGate({ allowedTools: [], maxToolCallsPerPlan: 100 });

    it('allows any tool when allowlist is empty', () => {
      expect(() =>
        permissiveGate.validateActions([{ tool: 'any.tool', args: {} }]),
      ).not.toThrow();
    });
  });
});
