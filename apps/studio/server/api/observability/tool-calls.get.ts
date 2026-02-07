/**
 * @file Tool Calls Observability Endpoint
 * @description GET /api/observability/tool-calls — Lists recent tool calls for a thread.
 * @remarks Returns tool calls with timing data for the Studio observability view.
 */

import { createError, getQuery } from 'h3';
import { query } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { thread_id, workspace_id } = getQuery(event);

  if (!workspace_id || typeof workspace_id !== 'string') {
    throw createError({ statusCode: 400, message: 'workspace_id is required' });
  }

  let sql = `
    SELECT id, message_id, thread_id, workspace_id, tool_name, tool_args,
           status, started_at, finished_at, duration_ms, error_message, created_at
    FROM tool_calls
    WHERE workspace_id = $1
  `;
  const params: unknown[] = [workspace_id];

  if (thread_id && typeof thread_id === 'string') {
    sql += ' AND thread_id = $2';
    params.push(thread_id);
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';

  const result = await query(config.databaseUrl, sql, params);

  return {
    toolCalls: result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      messageId: row.message_id,
      threadId: row.thread_id,
      workspaceId: row.workspace_id,
      toolName: row.tool_name,
      toolArgs: row.tool_args,
      status: row.status,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      durationMs: row.duration_ms,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    })),
  };
});
