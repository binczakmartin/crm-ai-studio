/**
 * @file Sources List Endpoint
 * @description GET /api/sources — Lists all sources for a workspace.
 * @remarks Returns sources ordered by creation date. Requires workspace_id query parameter.
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
    'SELECT id, workspace_id, name, type, status, created_at, updated_at FROM sources WHERE workspace_id = $1 ORDER BY created_at DESC',
    [workspace_id],
  );

  return {
    sources: result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      type: row.type,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
});
