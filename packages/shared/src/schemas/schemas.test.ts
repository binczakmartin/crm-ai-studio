/**
 * @file Schema Validation Tests
 * @description Unit tests for shared Zod schemas: Plan, ToolCall, ToolResult, VerifierReport, Answer.
 * @remarks Ensures schemas reject invalid data and accept valid data consistently.
 */

import { describe, it, expect } from 'vitest';
import {
  PlanSchema,
  ToolCallSchema,
  ToolResultSchema,
  VerifierReportSchema,
  AnswerSchema,
  CreateSourceSchema,
  CreateMessageSchema,
} from '../index.js';

describe('PlanSchema', () => {
  it('accepts a valid plan', () => {
    const result = PlanSchema.safeParse({
      intent: 'Query user count',
      actions: [{ tool: 'sql.query', args: { sql: 'SELECT COUNT(*) FROM users' } }],
      needsClarification: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a plan without intent', () => {
    const result = PlanSchema.safeParse({
      actions: [{ tool: 'sql.query', args: {} }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a plan without actions', () => {
    const result = PlanSchema.safeParse({
      intent: 'Query data',
      actions: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects actions with empty tool name', () => {
    const result = PlanSchema.safeParse({
      intent: 'Query data',
      actions: [{ tool: '', args: {} }],
    });
    expect(result.success).toBe(false);
  });
});

describe('ToolCallSchema', () => {
  it('accepts a valid tool call', () => {
    const result = ToolCallSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      threadId: '550e8400-e29b-41d4-a716-446655440001',
      workspaceId: '550e8400-e29b-41d4-a716-446655440002',
      toolName: 'sql.query',
      toolArgs: { sql: 'SELECT 1' },
      status: 'success',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = ToolCallSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      threadId: '550e8400-e29b-41d4-a716-446655440001',
      workspaceId: '550e8400-e29b-41d4-a716-446655440002',
      toolName: 'sql.query',
      toolArgs: {},
      status: 'invalid_status',
    });
    expect(result.success).toBe(false);
  });
});

describe('AnswerSchema', () => {
  it('accepts a valid answer with citations', () => {
    const result = AnswerSchema.safeParse({
      content: 'There are **10** users [1].',
      citations: [
        { index: 1, evidenceId: 'tr-123', evidenceType: 'tool_result', label: 'User count query' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an answer with empty citations', () => {
    const result = AnswerSchema.safeParse({
      content: 'I cannot answer this question without more data.',
      citations: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an answer without content', () => {
    const result = AnswerSchema.safeParse({
      content: '',
      citations: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('VerifierReportSchema', () => {
  it('accepts a valid approved report', () => {
    const result = VerifierReportSchema.safeParse({
      approved: true,
      checks: [
        { claim: 'Data exists', supported: true, evidenceId: 'tr-1', evidenceType: 'tool_result' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a rejected report with summary', () => {
    const result = VerifierReportSchema.safeParse({
      approved: false,
      checks: [
        { claim: 'Data exists', supported: false, reason: 'No rows returned' },
      ],
      summary: 'Insufficient evidence',
      suggestedActions: ['Refine the query'],
    });
    expect(result.success).toBe(true);
  });
});

describe('CreateSourceSchema', () => {
  it('accepts a valid source creation', () => {
    const result = CreateSourceSchema.safeParse({
      name: 'My Database',
      type: 'postgres',
      config: { host: 'localhost', port: 5432, database: 'db' },
      workspaceId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid source type', () => {
    const result = CreateSourceSchema.safeParse({
      name: 'Test',
      type: 'mysql',
      config: {},
      workspaceId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateMessageSchema', () => {
  it('accepts a valid message', () => {
    const result = CreateMessageSchema.safeParse({
      content: 'How many users do we have?',
      workspaceId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = CreateMessageSchema.safeParse({
      content: '',
      workspaceId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });
});
