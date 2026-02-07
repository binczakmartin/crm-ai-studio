/**
 * @file Workspace Schema
 * @description Zod schema and TypeScript type for workspaces.
 * @remarks Workspaces are the top-level tenant boundary. All entities are scoped to a workspace.
 */
import { z } from 'zod';
/** Schema for a workspace record. */
export declare const WorkspaceSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    config: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    config: Record<string, unknown>;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    id: string;
    name: string;
    createdAt?: string | undefined;
    config?: Record<string, unknown> | undefined;
    updatedAt?: string | undefined;
}>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
//# sourceMappingURL=workspace.d.ts.map