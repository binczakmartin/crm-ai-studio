/**
 * @file Threads List Endpoint
 * @description GET /api/threads — Lists threads for a workspace.
 * @remarks Returns threads ordered by most recent update.
 */

import { createError, getQuery } from 'h3';
import { query } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { workspace_id } = getQuery(event);

  if (!workspace_id || typeof workspace_id !== 'string') {
    throw createError({ statusCode: 400, message: 'workspace_id is required' });
  }

  const result = await query(
    config.databaseUrl,
    'SELECT id, workspace_id, title, created_at, updated_at FROM threads WHERE workspace_id = $1 ORDER BY updated_at DESC LIMIT 50',
    [workspace_id],
  );

  return {
    threads: result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
});
