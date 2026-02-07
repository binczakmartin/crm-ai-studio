/**
 * @file Source Schema
 * @description Zod schema and TypeScript type for data source configuration and permissions.
 * @remarks Sources are workspace-scoped. Default permissions are read-only, SELECT-only.
 */
import { z } from 'zod';
export declare const SourceTypeSchema: z.ZodEnum<["postgres", "mongo", "http", "files", "rag"]>;
export declare const SourceStatusSchema: z.ZodEnum<["pending", "active", "error", "disabled"]>;
/** Schema for Postgres source configuration. */
export declare const PostgresConfigSchema: z.ZodObject<{
    host: z.ZodString;
    port: z.ZodDefault<z.ZodNumber>;
    database: z.ZodString;
    user: z.ZodString;
    password: z.ZodString;
    ssl: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean;
}, {
    host: string;
    database: string;
    user: string;
    password: string;
    port?: number | undefined;
    ssl?: boolean | undefined;
}>;
/** Schema for a source record. */
export declare const SourceSchema: z.ZodObject<{
    id: z.ZodString;
    workspaceId: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["postgres", "mongo", "http", "files", "rag"]>;
    config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    status: z.ZodEnum<["pending", "active", "error", "disabled"]>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "error" | "active" | "disabled";
    type: "postgres" | "mongo" | "http" | "files" | "rag";
    id: string;
    workspaceId: string;
    name: string;
    config: Record<string, unknown>;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    status: "pending" | "error" | "active" | "disabled";
    type: "postgres" | "mongo" | "http" | "files" | "rag";
    id: string;
    workspaceId: string;
    name: string;
    config: Record<string, unknown>;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}>;
/** Schema for creating a new source. */
export declare const CreateSourceSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["postgres", "mongo", "http", "files", "rag"]>;
    config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    workspaceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "postgres" | "mongo" | "http" | "files" | "rag";
    workspaceId: string;
    name: string;
    config: Record<string, unknown>;
}, {
    type: "postgres" | "mongo" | "http" | "files" | "rag";
    workspaceId: string;
    name: string;
    config: Record<string, unknown>;
}>;
/** Schema for source permissions. */
export declare const SourcePermissionSchema: z.ZodObject<{
    id: z.ZodString;
    sourceId: z.ZodString;
    workspaceId: z.ZodString;
    canRead: z.ZodDefault<z.ZodBoolean>;
    canWrite: z.ZodDefault<z.ZodBoolean>;
    allowedTables: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    allowedOps: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    rowLimit: z.ZodDefault<z.ZodNumber>;
    rateLimitRpm: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    allowedTables: string[];
    id: string;
    workspaceId: string;
    sourceId: string;
    canRead: boolean;
    canWrite: boolean;
    allowedOps: string[];
    rowLimit: number;
    rateLimitRpm: number;
}, {
    id: string;
    workspaceId: string;
    sourceId: string;
    allowedTables?: string[] | undefined;
    canRead?: boolean | undefined;
    canWrite?: boolean | undefined;
    allowedOps?: string[] | undefined;
    rowLimit?: number | undefined;
    rateLimitRpm?: number | undefined;
}>;
export type SourceType = z.infer<typeof SourceTypeSchema>;
export type SourceStatus = z.infer<typeof SourceStatusSchema>;
export type PostgresConfig = z.infer<typeof PostgresConfigSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type CreateSource = z.infer<typeof CreateSourceSchema>;
export type SourcePermission = z.infer<typeof SourcePermissionSchema>;
//# sourceMappingURL=source.d.ts.map