/**
 * @file ToolResult Schema
 * @description Zod schema and TypeScript type for tool execution results. Results are stored with
 *   checksums and row counts for auditability and evidence traceability.
 * @remarks Never fabricate tool results. If execution fails, store failure with reason.
 */
import { z } from 'zod';
/** Schema for a tool result record. */
export declare const ToolResultSchema: z.ZodObject<{
    /** Unique identifier. */
    id: z.ZodString;
    /** The tool call this result belongs to. */
    toolCallId: z.ZodString;
    /** Thread scope. */
    threadId: z.ZodString;
    /** Workspace scope. */
    workspaceId: z.ZodString;
    /** Structured result data. */
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    /** Number of rows returned (for SQL queries). */
    rowCount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    /** SHA-256 checksum of the result data for integrity verification. */
    checksum: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /** Preview rows for UI display (first N rows). */
    previewRows: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>>;
    /** Creation timestamp. */
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    threadId: string;
    workspaceId: string;
    toolCallId: string;
    data: Record<string, unknown>;
    createdAt?: string | undefined;
    rowCount?: number | null | undefined;
    checksum?: string | null | undefined;
    previewRows?: Record<string, unknown>[] | null | undefined;
}, {
    id: string;
    threadId: string;
    workspaceId: string;
    toolCallId: string;
    data: Record<string, unknown>;
    createdAt?: string | undefined;
    rowCount?: number | null | undefined;
    checksum?: string | null | undefined;
    previewRows?: Record<string, unknown>[] | null | undefined;
}>;
export type ToolResult = z.infer<typeof ToolResultSchema>;
//# sourceMappingURL=tool-result.d.ts.map