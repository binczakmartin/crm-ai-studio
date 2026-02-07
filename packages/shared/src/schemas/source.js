/**
 * @file Source Schema
 * @description Zod schema and TypeScript type for data source configuration and permissions.
 * @remarks Sources are workspace-scoped. Default permissions are read-only, SELECT-only.
 */
import { z } from 'zod';
export const SourceTypeSchema = z.enum(['postgres', 'mongo', 'http', 'files', 'rag']);
export const SourceStatusSchema = z.enum(['pending', 'active', 'error', 'disabled']);
/** Schema for Postgres source configuration. */
export const PostgresConfigSchema = z.object({
    host: z.string().min(1),
    port: z.number().int().positive().default(5432),
    database: z.string().min(1),
    user: z.string().min(1),
    password: z.string().min(1),
    ssl: z.boolean().default(false),
});
/** Schema for a source record. */
export const SourceSchema = z.object({
    id: z.string().uuid(),
    workspaceId: z.string().uuid(),
    name: z.string().min(1),
    type: SourceTypeSchema,
    config: z.record(z.unknown()),
    status: SourceStatusSchema,
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
});
/** Schema for creating a new source. */
export const CreateSourceSchema = z.object({
    name: z.string().min(1).max(255),
    type: SourceTypeSchema,
    config: z.record(z.unknown()),
    workspaceId: z.string().uuid(),
});
/** Schema for source permissions. */
export const SourcePermissionSchema = z.object({
    id: z.string().uuid(),
    sourceId: z.string().uuid(),
    workspaceId: z.string().uuid(),
    canRead: z.boolean().default(true),
    canWrite: z.boolean().default(false),
    allowedTables: z.array(z.string()).default([]),
    allowedOps: z.array(z.string()).default(['SELECT']),
    rowLimit: z.number().int().positive().default(200),
    rateLimitRpm: z.number().int().positive().default(60),
});
//# sourceMappingURL=source.js.map