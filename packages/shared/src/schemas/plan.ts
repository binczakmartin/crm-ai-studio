/**
 * @file Plan Schema
 * @description Zod schema and TypeScript type for the planner output. The Plan is a structured JSON
 *   object that the LLM must produce (no free-form text). It describes the user's intent and the
 *   tool actions required to fulfill it.
 * @remarks The planner must NEVER produce user-facing text. Only structured Plan JSON.
 */

import { z } from 'zod';

/** Schema for a single planned tool action within a Plan. */
export const PlanActionSchema = z.object({
  /** Tool to invoke (e.g., 'sql.query', 'rag.search'). */
  tool: z.string().min(1),
  /** Arguments to pass to the tool. */
  args: z.record(z.unknown()),
  /** Human-readable reason for this action (internal, not shown to user). */
  reason: z.string().optional(),
});

/** Schema for Plan constraints (limits, allowlists). */
export const PlanConstraintsSchema = z.object({
  /** Maximum rows for SQL queries. */
  maxRows: z.number().int().positive().optional(),
  /** Source IDs this plan is scoped to. */
  sourceIds: z.array(z.string().uuid()).optional(),
  /** Allowlisted table names. */
  allowedTables: z.array(z.string()).optional(),
});

/** Schema for the full Plan JSON output from the planner. */
export const PlanSchema = z.object({
  /** The interpreted user intent (short summary). */
  intent: z.string().min(1),
  /** Ordered list of tool actions to execute. */
  actions: z.array(PlanActionSchema).min(1),
  /** Constraints to enforce during tool execution. */
  constraints: PlanConstraintsSchema.optional(),
  /** If true, the planner needs clarification from the user before proceeding. */
  needsClarification: z.boolean().default(false),
  /** Clarification question (only if needsClarification is true). */
  clarificationQuestion: z.string().optional(),
});

export type PlanAction = z.infer<typeof PlanActionSchema>;
export type PlanConstraints = z.infer<typeof PlanConstraintsSchema>;
export type Plan = z.infer<typeof PlanSchema>;
