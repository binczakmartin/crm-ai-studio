/**
 * @file Workspaces List Endpoint
 * @description GET /api/workspaces — Lists all workspaces.
 * @remarks For MVP, returns all workspaces (no auth filtering).
 */

import { query } from '../../utils/db';

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  const result = await query(
    config.databaseUrl,
    'SELECT id, name, config, created_at, updated_at FROM workspaces ORDER BY created_at DESC LIMIT 50',
  );

  return {
    workspaces: result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      config: row.config ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
});
