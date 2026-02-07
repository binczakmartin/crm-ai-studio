/**
 * @file Source Test Connection Endpoint
 * @description POST /api/sources/test — Tests a database connection with the provided config.
 * @remarks Does not persist anything. Only validates connectivity.
 */

import { createError, readBody } from 'h3';
import { PostgresConnector } from '@crm-ai/connectors';
import { PostgresConfigSchema } from '@crm-ai/shared';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body || body.type !== 'postgres') {
    throw createError({ statusCode: 400, message: 'Only postgres type is supported for testing.' });
  }

  const parsed = PostgresConfigSchema.safeParse(body.config);
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: `Invalid config: ${parsed.error.message}` });
  }

  const { host, port, database, user, password, ssl } = parsed.data;
  const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}${ssl ? '?sslmode=require' : ''}`;

  const connector = new PostgresConnector({ connectionString });
  try {
    const result = await connector.testConnection();
    return result;
  } finally {
    await connector.disconnect();
  }
});
