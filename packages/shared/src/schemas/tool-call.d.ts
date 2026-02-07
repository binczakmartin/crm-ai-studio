/**
 * @file ToolCall Schema
 * @description Zod schema and TypeScript type for tool call records. Each tool call is uniquely
 *   identified and tracks its lifecycle (pending → running → success/error/blocked).
 * @remarks Tool calls are persisted to the database for audit and observability.
 */
import { z } from 'zod';
/** Possible statuses for a tool call. */
export declare const ToolCallStatusSchema: z.ZodEnum<["pending", "running", "success", "error", "blocked"]>;
/** Schema for a tool call record. */
export declare const ToolCallSchema: z.ZodObject<{
    /** Unique identifier for this tool call. */
    id: z.ZodString;
    /** Associated message ID (nullable if not yet linked). */
    messageId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /** Thread this tool call belongs to. */
    threadId: z.ZodString;
    /** Workspace scope. */
    workspaceId: z.ZodString;
    /** Name of the tool invoked (e.g., 'sql.query', 'rag.search'). */
    toolName: z.ZodString;
    /** Arguments passed to the tool. */
    toolArgs: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    /** Current status. */
    status: z.ZodEnum<["pending", "running", "success", "error", "blocked"]>;
    /** When execution started. */
    startedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /** When execution finished. */
    finishedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /** Duration in milliseconds. */
    durationMs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    /** Error message if status is 'error' or 'blocked'. */
    errorMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /** Creation timestamp. */
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "running" | "success" | "error" | "blocked";
    id: string;
    threadId: string;
    workspaceId: string;
    toolName: string;
    toolArgs: Record<string, unknown>;
    messageId?: string | null | undefined;
    startedAt?: string | null | undefined;
    finishedAt?: string | null | undefined;
    durationMs?: number | null | undefined;
    errorMessage?: string | null | undefined;
    createdAt?: string | undefined;
}, {
    status: "pending" | "running" | "success" | "error" | "blocked";
    id: string;
    threadId: string;
    workspaceId: string;
    toolName: string;
    toolArgs: Record<string, unknown>;
    messageId?: string | null | undefined;
    startedAt?: string | null | undefined;
    finishedAt?: string | null | undefined;
    durationMs?: number | null | undefined;
    errorMessage?: string | null | undefined;
    createdAt?: string | undefined;
}>;
export type ToolCallStatus = z.infer<typeof ToolCallStatusSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;
//# sourceMappingURL=tool-call.d.ts.map