/**
 * @file Sources Create Endpoint
 * @description POST /api/sources — Creates a new data source for a workspace.
 * @remarks Defaults to read-only permissions. Validates config with Zod.
 */

import { createError, readBody } from 'h3';
import { CreateSourceSchema } from '@crm-ai/shared';
import { query } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const parsed = CreateSourceSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: `Invalid source: ${parsed.error.message}` });
  }

  const { name, type, config: sourceConfig, workspaceId } = parsed.data;

  // Insert source
  const result = await query(
    config.databaseUrl,
    `INSERT INTO sources (workspace_id, name, type, config, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id, workspace_id, name, type, status, created_at`,
    [workspaceId, name, type, JSON.stringify(sourceConfig)],
  );

  const source = result.rows[0];

  // Create default read-only permissions
  await query(
    config.databaseUrl,
    `INSERT INTO source_permissions (source_id, workspace_id, can_read, can_write, allowed_ops, row_limit)
     VALUES ($1, $2, true, false, $3, $4)`,
    [source.id, workspaceId, JSON.stringify(['SELECT']), 200],
  );

  return {
    source: {
      id: source.id,
      workspaceId: source.workspace_id,
      name: source.name,
      type: source.type,
      status: source.status,
      createdAt: source.created_at,
    },
  };
});
