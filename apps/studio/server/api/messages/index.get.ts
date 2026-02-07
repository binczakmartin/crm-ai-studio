/**
 * @file Messages List Endpoint
 * @description GET /api/messages — Lists messages for a thread.
 * @remarks Returns messages in chronological order.
 */

import { createError, getQuery } from 'h3';
import { query } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { thread_id } = getQuery(event);

  if (!thread_id || typeof thread_id !== 'string') {
    throw createError({ statusCode: 400, message: 'thread_id is required' });
  }

  const result = await query(
    config.databaseUrl,
    'SELECT id, thread_id, workspace_id, role, content, citations, metadata, created_at FROM messages WHERE thread_id = $1 ORDER BY created_at ASC',
    [thread_id],
  );

  return {
    messages: result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      threadId: row.thread_id,
      workspaceId: row.workspace_id,
      role: row.role,
      content: row.content,
      citations: row.citations ?? [],
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    })),
  };
});
