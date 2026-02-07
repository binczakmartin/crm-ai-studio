/**
 * @file Plan Schema
 * @description Zod schema and TypeScript type for the planner output. The Plan is a structured JSON
 *   object that the LLM must produce (no free-form text). It describes the user's intent and the
 *   tool actions required to fulfill it.
 * @remarks The planner must NEVER produce user-facing text. Only structured Plan JSON.
 */
import { z } from 'zod';
/** Schema for a single planned tool action within a Plan. */
export declare const PlanActionSchema: z.ZodObject<{
    /** Tool to invoke (e.g., 'sql.query', 'rag.search'). */
    tool: z.ZodString;
    /** Arguments to pass to the tool. */
    args: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    /** Human-readable reason for this action (internal, not shown to user). */
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tool: string;
    args: Record<string, unknown>;
    reason?: string | undefined;
}, {
    tool: string;
    args: Record<string, unknown>;
    reason?: string | undefined;
}>;
/** Schema for Plan constraints (limits, allowlists). */
export declare const PlanConstraintsSchema: z.ZodObject<{
    /** Maximum rows for SQL queries. */
    maxRows: z.ZodOptional<z.ZodNumber>;
    /** Source IDs this plan is scoped to. */
    sourceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Allowlisted table names. */
    allowedTables: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    maxRows?: number | undefined;
    sourceIds?: string[] | undefined;
    allowedTables?: string[] | undefined;
}, {
    maxRows?: number | undefined;
    sourceIds?: string[] | undefined;
    allowedTables?: string[] | undefined;
}>;
/** Schema for the full Plan JSON output from the planner. */
export declare const PlanSchema: z.ZodObject<{
    /** The interpreted user intent (short summary). */
    intent: z.ZodString;
    /** Ordered list of tool actions to execute. */
    actions: z.ZodArray<z.ZodObject<{
        /** Tool to invoke (e.g., 'sql.query', 'rag.search'). */
        tool: z.ZodString;
        /** Arguments to pass to the tool. */
        args: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        /** Human-readable reason for this action (internal, not shown to user). */
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tool: string;
        args: Record<string, unknown>;
        reason?: string | undefined;
    }, {
        tool: string;
        args: Record<string, unknown>;
        reason?: string | undefined;
    }>, "many">;
    /** Constraints to enforce during tool execution. */
    constraints: z.ZodOptional<z.ZodObject<{
        /** Maximum rows for SQL queries. */
        maxRows: z.ZodOptional<z.ZodNumber>;
        /** Source IDs this plan is scoped to. */
        sourceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        /** Allowlisted table names. */
        allowedTables: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        maxRows?: number | undefined;
        sourceIds?: string[] | undefined;
        allowedTables?: string[] | undefined;
    }, {
        maxRows?: number | undefined;
        sourceIds?: string[] | undefined;
        allowedTables?: string[] | undefined;
    }>>;
    /** If true, the planner needs clarification from the user before proceeding. */
    needsClarification: z.ZodDefault<z.ZodBoolean>;
    /** Clarification question (only if needsClarification is true). */
    clarificationQuestion: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    intent: string;
    actions: {
        tool: string;
        args: Record<string, unknown>;
        reason?: string | undefined;
    }[];
    needsClarification: boolean;
    constraints?: {
        maxRows?: number | undefined;
        sourceIds?: string[] | undefined;
        allowedTables?: string[] | undefined;
    } | undefined;
    clarificationQuestion?: string | undefined;
}, {
    intent: string;
    actions: {
        tool: string;
        args: Record<string, unknown>;
        reason?: string | undefined;
    }[];
    constraints?: {
        maxRows?: number | undefined;
        sourceIds?: string[] | undefined;
        allowedTables?: string[] | undefined;
    } | undefined;
    needsClarification?: boolean | undefined;
    clarificationQuestion?: string | undefined;
}>;
export type PlanAction = z.infer<typeof PlanActionSchema>;
export type PlanConstraints = z.infer<typeof PlanConstraintsSchema>;
export type Plan = z.infer<typeof PlanSchema>;
//# sourceMappingURL=plan.d.ts.map