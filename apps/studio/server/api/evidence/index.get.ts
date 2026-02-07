/**
 * @file Evidence Endpoint
 * @description GET /api/evidence — Fetches evidence (tool calls + verification) for a specific message.
 * @remarks Used to restore the Evidence drawer when reloading a page or switching threads.
 *   Returns tool calls with their args (SQL queries) and the verification report.
 */

import { createError, getQuery } from 'h3';
import { query } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { message_id } = getQuery(event);

  if (!message_id || typeof message_id !== 'string') {
    throw createError({ statusCode: 400, message: 'message_id is required' });
  }

  // Fetch tool calls for this message
  const toolCallsResult = await query(
    config.databaseUrl,
    `SELECT id, tool_name, tool_args, status, duration_ms, error_message, created_at
     FROM tool_calls
     WHERE message_id = $1
     ORDER BY created_at ASC`,
    [message_id],
  );

  // Fetch verification report (stored as a system message with role='system' and content='verification')
  // Look for the verification message in the same thread, right after this message
  const verificationResult = await query(
    config.databaseUrl,
    `SELECT metadata FROM messages
     WHERE thread_id = (SELECT thread_id FROM messages WHERE id = $1)
       AND role = 'system'
       AND content = 'verification'
       AND created_at >= (SELECT created_at FROM messages WHERE id = $1)
     ORDER BY created_at ASC
     LIMIT 1`,
    [message_id],
  );

  const toolCalls = toolCallsResult.rows.map((row: Record<string, unknown>) => {
    const args = (row.tool_args ?? {}) as Record<string, unknown>;
    return {
      tool: row.tool_name as string,
      args,
      status: row.status as string,
      durationMs: row.duration_ms as number | null,
      rowCount: null, // Not stored in DB currently
      error: row.error_message as string | null,
    };
  });

  const verification = verificationResult.rows.length > 0
    ? (verificationResult.rows[0] as Record<string, unknown>).metadata
    : null;

  return { toolCalls, verification };
});
