/**
 * @file Answer Schema
 * @description Zod schema and TypeScript type for the final grounded answer. Every answer MUST
 *   include citations mapping claims to evidence IDs (tool_result_id or chunk_id).
 * @remarks Un-cited numbers or factual assertions are forbidden by the evidence-first pipeline.
 */

import { z } from 'zod';

/** Schema for a single citation within an answer. */
export const CitationSchema = z.object({
  /** Citation index (1-based, for display). */
  index: z.number().int().positive(),
  /** Evidence source ID (tool_result_id or chunk_id). */
  evidenceId: z.string(),
  /** Type of evidence. */
  evidenceType: z.enum(['tool_result', 'chunk']),
  /** Short label or excerpt for UI display. */
  label: z.string().optional(),
});

/** Schema for a follow-up suggestion. */
export const FollowUpSchema = z.object({
  /** Suggested follow-up question or action. */
  text: z.string(),
  /** Pre-built plan for the follow-up (optional). */
  planHint: z.string().optional(),
});

/** Schema for the final grounded answer. */
export const AnswerSchema = z.object({
  /** Markdown-formatted answer content. Citations are referenced as [1], [2], etc. */
  content: z.string().min(1),
  /** List of citations backing claims in the content. */
  citations: z.array(CitationSchema).min(0),
  /** Optional follow-up suggestions. */
  followUps: z.array(FollowUpSchema).optional(),
});

export type Citation = z.infer<typeof CitationSchema>;
export type FollowUp = z.infer<typeof FollowUpSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
