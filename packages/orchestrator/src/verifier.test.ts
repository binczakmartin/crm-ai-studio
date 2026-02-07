/**
 * @file Verifier Tests
 * @description Unit tests for the verifier stage. Ensures evidence requirements are enforced:
 *   no answer without tool results, rejected when all tools fail, etc.
 * @remarks Tests the evidence-first constraint enforcement.
 */

import { describe, it, expect } from 'vitest';
import { Verifier } from './verifier.js';
import { VerificationError } from '@crm-ai/shared';
import type { ToolExecutionResult } from './tool-runtime.js';
import type { ToolCall, ToolResult } from '@crm-ai/shared';

function makeToolCall(overrides: Partial<ToolCall> = {}): ToolCall {
  return {
    id: crypto.randomUUID(),
    threadId: crypto.randomUUID(),
    workspaceId: crypto.randomUUID(),
    toolName: 'sql.query',
    toolArgs: { sql: 'SELECT 1' },
    status: 'success',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 50,
    errorMessage: null,
    ...overrides,
  };
}

function makeToolResult(overrides: Partial<ToolResult> = {}): ToolResult {
  return {
    id: crypto.randomUUID(),
    toolCallId: crypto.randomUUID(),
    threadId: crypto.randomUUID(),
    workspaceId: crypto.randomUUID(),
    data: { rows: [{ count: 10 }] },
    rowCount: 1,
    checksum: 'abc123',
    previewRows: [{ count: 10 }],
    ...overrides,
  };
}

describe('Verifier', () => {
  const verifier = new Verifier();

  it('approves when at least one tool succeeds with data', () => {
    const results: ToolExecutionResult[] = [
      { toolCall: makeToolCall({ status: 'success' }), toolResult: makeToolResult({ rowCount: 5 }) },
    ];
    const report = verifier.verify(results, 'How many users?');
    expect(report.approved).toBe(true);
  });

  it('reports failed tools', () => {
    const results: ToolExecutionResult[] = [
      { toolCall: makeToolCall({ status: 'error', errorMessage: 'Connection refused' }), toolResult: null },
    ];
    const report = verifier.verify(results, 'How many users?');
    expect(report.approved).toBe(false);
    expect(report.checks.some((c) => !c.supported)).toBe(true);
  });

  it('warns when tool returns no data', () => {
    const results: ToolExecutionResult[] = [
      { toolCall: makeToolCall({ status: 'success' }), toolResult: makeToolResult({ rowCount: 0 }) },
    ];
    const report = verifier.verify(results, 'How many users?');
    expect(report.checks.some((c) => c.reason?.includes('No rows'))).toBe(true);
  });

  it('handles mixed success and failure', () => {
    const results: ToolExecutionResult[] = [
      { toolCall: makeToolCall({ status: 'success', toolName: 'sql.query' }), toolResult: makeToolResult({ rowCount: 3 }) },
      { toolCall: makeToolCall({ status: 'error', toolName: 'rag.search', errorMessage: 'Not configured' }), toolResult: null },
    ];
    const report = verifier.verify(results, 'Find data');
    // Should still approve because at least one tool succeeded
    expect(report.approved).toBe(true);
    expect(report.checks.length).toBeGreaterThan(1);
  });

  describe('verifyOrThrow', () => {
    it('returns report when evidence exists', () => {
      const results: ToolExecutionResult[] = [
        { toolCall: makeToolCall({ status: 'success' }), toolResult: makeToolResult({ rowCount: 1 }) },
      ];
      const report = verifier.verifyOrThrow(results, 'Query');
      expect(report).toBeDefined();
    });

    it('throws VerificationError when all tools fail', () => {
      const results: ToolExecutionResult[] = [
        { toolCall: makeToolCall({ status: 'error', errorMessage: 'fail' }), toolResult: null },
      ];
      expect(() => verifier.verifyOrThrow(results, 'Query')).toThrow(VerificationError);
    });
  });
});
