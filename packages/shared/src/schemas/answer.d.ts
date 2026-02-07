/**
 * @file Answer Schema
 * @description Zod schema and TypeScript type for the final grounded answer. Every answer MUST
 *   include citations mapping claims to evidence IDs (tool_result_id or chunk_id).
 * @remarks Un-cited numbers or factual assertions are forbidden by the evidence-first pipeline.
 */
import { z } from 'zod';
/** Schema for a single citation within an answer. */
export declare const CitationSchema: z.ZodObject<{
    /** Citation index (1-based, for display). */
    index: z.ZodNumber;
    /** Evidence source ID (tool_result_id or chunk_id). */
    evidenceId: z.ZodString;
    /** Type of evidence. */
    evidenceType: z.ZodEnum<["tool_result", "chunk"]>;
    /** Short label or excerpt for UI display. */
    label: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    evidenceId: string;
    evidenceType: "tool_result" | "chunk";
    index: number;
    label?: string | undefined;
}, {
    evidenceId: string;
    evidenceType: "tool_result" | "chunk";
    index: number;
    label?: string | undefined;
}>;
/** Schema for a follow-up suggestion. */
export declare const FollowUpSchema: z.ZodObject<{
    /** Suggested follow-up question or action. */
    text: z.ZodString;
    /** Pre-built plan for the follow-up (optional). */
    planHint: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    planHint?: string | undefined;
}, {
    text: string;
    planHint?: string | undefined;
}>;
/** Schema for the final grounded answer. */
export declare const AnswerSchema: z.ZodObject<{
    /** Markdown-formatted answer content. Citations are referenced as [1], [2], etc. */
    content: z.ZodString;
    /** List of citations backing claims in the content. */
    citations: z.ZodArray<z.ZodObject<{
        /** Citation index (1-based, for display). */
        index: z.ZodNumber;
        /** Evidence source ID (tool_result_id or chunk_id). */
        evidenceId: z.ZodString;
        /** Type of evidence. */
        evidenceType: z.ZodEnum<["tool_result", "chunk"]>;
        /** Short label or excerpt for UI display. */
        label: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        evidenceId: string;
        evidenceType: "tool_result" | "chunk";
        index: number;
        label?: string | undefined;
    }, {
        evidenceId: string;
        evidenceType: "tool_result" | "chunk";
        index: number;
        label?: string | undefined;
    }>, "many">;
    /** Optional follow-up suggestions. */
    followUps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        /** Suggested follow-up question or action. */
        text: z.ZodString;
        /** Pre-built plan for the follow-up (optional). */
        planHint: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        planHint?: string | undefined;
    }, {
        text: string;
        planHint?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    citations: {
        evidenceId: string;
        evidenceType: "tool_result" | "chunk";
        index: number;
        label?: string | undefined;
    }[];
    followUps?: {
        text: string;
        planHint?: string | undefined;
    }[] | undefined;
}, {
    content: string;
    citations: {
        evidenceId: string;
        evidenceType: "tool_result" | "chunk";
        index: number;
        label?: string | undefined;
    }[];
    followUps?: {
        text: string;
        planHint?: string | undefined;
    }[] | undefined;
}>;
export type Citation = z.infer<typeof CitationSchema>;
export type FollowUp = z.infer<typeof FollowUpSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
//# sourceMappingURL=answer.d.ts.map