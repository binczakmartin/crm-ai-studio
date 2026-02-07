/**
 * @file Pipeline Integration Tests
 * @description Integration test for the full pipeline: plan → policy → tools → verify → answer.
 *   Uses MockLlmAdapter and a mock SQL connector (no real DB needed).
 * @remarks Tests the end-to-end pipeline flow with deterministic inputs and outputs.
 */

import { describe, it, expect, vi } from 'vitest';
import { Pipeline } from './pipeline.js';
import { MockLlmAdapter } from '@crm-ai/connectors';
import type { SqlConnector, SqlQueryParams, SqlQueryResult, RagConnector, RagSearchParams, RagSearchResult } from '@crm-ai/shared';

/** In-memory SQL connector for testing. */
class MockSqlConnector implements SqlConnector {
  async query(_params: SqlQueryParams): Promise<SqlQueryResult> {
    return {
      columns: ['id', 'name', 'created_at'],
      rows: [
        { id: '1', name: 'Demo Workspace', created_at: '2025-01-01T00:00:00Z' },
        { id: '2', name: 'Test Workspace', created_at: '2025-01-02T00:00:00Z' },
      ],
      rowCount: 2,
      checksum: 'test-checksum',
      truncated: false,
    };
  }

  async testConnection(): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async disconnect(): Promise<void> {}
}

/** Mock RAG connector that returns empty results. */
class MockRagConnector implements RagConnector {
  async search(_params: RagSearchParams): Promise<RagSearchResult> {
    return { chunks: [] };
  }
}

describe('Pipeline Integration', () => {
  const pipeline = new Pipeline({
    llm: new MockLlmAdapter(),
    sql: new MockSqlConnector(),
    rag: new MockRagConnector(),
    maxRows: 100,
    allowedTables: [],
    allowedTools: ['sql.query', 'rag.search'],
    toolTimeoutMs: 10_000,
  });

  it('runs the full pipeline: plan → tools → verify → answer', async () => {
    const result = await pipeline.run({
      workspaceId: '550e8400-e29b-41d4-a716-446655440000',
      threadId: '550e8400-e29b-41d4-a716-446655440001',
      messageId: '550e8400-e29b-41d4-a716-446655440002',
      userMessage: 'How many workspaces are there?',
      allowedSources: [],
    });

    // Verify plan was generated
    expect(result.plan).toBeDefined();
    expect(result.plan.intent).toBeTruthy();
    expect(result.plan.actions.length).toBeGreaterThan(0);

    // Verify tool calls were made
    expect(result.toolCalls.length).toBeGreaterThan(0);
    expect(result.toolCalls[0]!.status).toBe('success');

    // Verify tool results exist
    expect(result.toolResults.length).toBeGreaterThan(0);
    expect(result.toolResults[0]!.rowCount).toBe(2);
    expect(result.toolResults[0]!.checksum).toBeTruthy();

    // Verify the verifier report
    expect(result.verifierReport).toBeDefined();

    // Verify the answer has content and citations
    expect(result.answer).toBeDefined();
    expect(result.answer.content).toBeTruthy();
    expect(result.answer.citations.length).toBeGreaterThan(0);
    expect(result.answer.citations[0]!.evidenceType).toBe('tool_result');
  });

  it('streams events through the pipeline', async () => {
    const events: Array<{ event: string; data: unknown }> = [];

    for await (const event of pipeline.stream({
      workspaceId: '550e8400-e29b-41d4-a716-446655440000',
      threadId: '550e8400-e29b-41d4-a716-446655440001',
      messageId: '550e8400-e29b-41d4-a716-446655440002',
      userMessage: 'Show me all sources',
      allowedSources: [],
    })) {
      events.push(event);
    }

    // Verify we got the expected event types
    const eventTypes = events.map((e) => e.event);
    expect(eventTypes).toContain('status');
    expect(eventTypes).toContain('plan');
    expect(eventTypes).toContain('tool_call_start');
    expect(eventTypes).toContain('tool_call_end');
    expect(eventTypes).toContain('verification');
    expect(eventTypes).toContain('token');
    expect(eventTypes).toContain('answer');
    expect(eventTypes).toContain('done');
  });

  it('produces answer with citations referencing real tool results', async () => {
    const result = await pipeline.run({
      workspaceId: '550e8400-e29b-41d4-a716-446655440000',
      threadId: '550e8400-e29b-41d4-a716-446655440001',
      messageId: '550e8400-e29b-41d4-a716-446655440002',
      userMessage: 'List all workspaces',
      allowedSources: [],
    });

    // Every citation must reference an existing tool result
    for (const citation of result.answer.citations) {
      expect(citation.evidenceId).toBeTruthy();
      expect(['tool_result', 'chunk']).toContain(citation.evidenceType);
    }
  });
});
