/**
 * @file ToolResult Schema
 * @description Zod schema and TypeScript type for tool execution results. Results are stored with
 *   checksums and row counts for auditability and evidence traceability.
 * @remarks Never fabricate tool results. If execution fails, store failure with reason.
 */
import { z } from 'zod';
/** Schema for a tool result record. */
export const ToolResultSchema = z.object({
    /** Unique identifier. */
    id: z.string().uuid(),
    /** The tool call this result belongs to. */
    toolCallId: z.string().uuid(),
    /** Thread scope. */
    threadId: z.string().uuid(),
    /** Workspace scope. */
    workspaceId: z.string().uuid(),
    /** Structured result data. */
    data: z.record(z.unknown()),
    /** Number of rows returned (for SQL queries). */
    rowCount: z.number().int().nonnegative().nullable().optional(),
    /** SHA-256 checksum of the result data for integrity verification. */
    checksum: z.string().nullable().optional(),
    /** Preview rows for UI display (first N rows). */
    previewRows: z.array(z.record(z.unknown())).nullable().optional(),
    /** Creation timestamp. */
    createdAt: z.string().datetime().optional(),
});
//# sourceMappingURL=tool-result.js.map