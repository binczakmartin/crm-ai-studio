/**
 * @file ToolCall Schema
 * @description Zod schema and TypeScript type for tool call records. Each tool call is uniquely
 *   identified and tracks its lifecycle (pending → running → success/error/blocked).
 * @remarks Tool calls are persisted to the database for audit and observability.
 */

import { z } from 'zod';

/** Possible statuses for a tool call. */
export const ToolCallStatusSchema = z.enum(['pending', 'running', 'success', 'error', 'blocked']);

/** Schema for a tool call record. */
export const ToolCallSchema = z.object({
  /** Unique identifier for this tool call. */
  id: z.string().uuid(),
  /** Associated message ID (nullable if not yet linked). */
  messageId: z.string().uuid().nullable().optional(),
  /** Thread this tool call belongs to. */
  threadId: z.string().uuid(),
  /** Workspace scope. */
  workspaceId: z.string().uuid(),
  /** Name of the tool invoked (e.g., 'sql.query', 'rag.search'). */
  toolName: z.string().min(1),
  /** Arguments passed to the tool. */
  toolArgs: z.record(z.unknown()),
  /** Current status. */
  status: ToolCallStatusSchema,
  /** When execution started. */
  startedAt: z.string().datetime().nullable().optional(),
  /** When execution finished. */
  finishedAt: z.string().datetime().nullable().optional(),
  /** Duration in milliseconds. */
  durationMs: z.number().int().nonnegative().nullable().optional(),
  /** Error message if status is 'error' or 'blocked'. */
  errorMessage: z.string().nullable().optional(),
  /** Creation timestamp. */
  createdAt: z.string().datetime().optional(),
});

export type ToolCallStatus = z.infer<typeof ToolCallStatusSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;
