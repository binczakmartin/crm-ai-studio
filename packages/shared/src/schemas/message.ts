/**
 * @file Message Schema
 * @description Zod schema and TypeScript type for chat messages (user, assistant, system).
 * @remarks Messages are immutable once created. Citations are stored as JSONB arrays.
 */

import { z } from 'zod';
import { CitationSchema } from './answer.js';

export const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);

/** Schema for a chat message. */
export const MessageSchema = z.object({
  id: z.string().uuid(),
  threadId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  role: MessageRoleSchema,
  content: z.string(),
  citations: z.array(CitationSchema).default([]),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime().optional(),
});

/** Schema for creating a new message (from user). */
export const CreateMessageSchema = z.object({
  content: z.string().min(1).max(10_000),
  workspaceId: z.string().uuid(),
  threadId: z.string().uuid().optional(),
});

export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type CreateMessage = z.infer<typeof CreateMessageSchema>;
