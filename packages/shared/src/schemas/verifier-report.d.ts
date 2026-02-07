/**
 * @file VerifierReport Schema
 * @description Zod schema and TypeScript type for the verifier's output. The verifier ensures that
 *   every claim in the final answer is backed by evidence from tool results or RAG chunks.
 * @remarks If verification fails, the pipeline must NOT produce an answer.
 */
import { z } from 'zod';
/** Schema for a single evidence check within the verifier report. */
export declare const EvidenceCheckSchema: z.ZodObject<{
    /** The claim or assertion being verified. */
    claim: z.ZodString;
    /** Whether the claim is supported by evidence. */
    supported: z.ZodBoolean;
    /** Evidence source ID (tool_result_id or chunk_id). */
    evidenceId: z.ZodOptional<z.ZodString>;
    /** Type of evidence ('tool_result' or 'chunk'). */
    evidenceType: z.ZodOptional<z.ZodEnum<["tool_result", "chunk"]>>;
    /** Reason for the verdict. */
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    claim: string;
    supported: boolean;
    reason?: string | undefined;
    evidenceId?: string | undefined;
    evidenceType?: "tool_result" | "chunk" | undefined;
}, {
    claim: string;
    supported: boolean;
    reason?: string | undefined;
    evidenceId?: string | undefined;
    evidenceType?: "tool_result" | "chunk" | undefined;
}>;
/** Schema for the full verifier report. */
export declare const VerifierReportSchema: z.ZodObject<{
    /** Whether all claims are supported (answer can proceed). */
    approved: z.ZodBoolean;
    /** Individual evidence checks. */
    checks: z.ZodArray<z.ZodObject<{
        /** The claim or assertion being verified. */
        claim: z.ZodString;
        /** Whether the claim is supported by evidence. */
        supported: z.ZodBoolean;
        /** Evidence source ID (tool_result_id or chunk_id). */
        evidenceId: z.ZodOptional<z.ZodString>;
        /** Type of evidence ('tool_result' or 'chunk'). */
        evidenceType: z.ZodOptional<z.ZodEnum<["tool_result", "chunk"]>>;
        /** Reason for the verdict. */
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        claim: string;
        supported: boolean;
        reason?: string | undefined;
        evidenceId?: string | undefined;
        evidenceType?: "tool_result" | "chunk" | undefined;
    }, {
        claim: string;
        supported: boolean;
        reason?: string | undefined;
        evidenceId?: string | undefined;
        evidenceType?: "tool_result" | "chunk" | undefined;
    }>, "many">;
    /** Summary of issues if not approved. */
    summary: z.ZodOptional<z.ZodString>;
    /** Suggested follow-up actions if evidence is insufficient. */
    suggestedActions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    approved: boolean;
    checks: {
        claim: string;
        supported: boolean;
        reason?: string | undefined;
        evidenceId?: string | undefined;
        evidenceType?: "tool_result" | "chunk" | undefined;
    }[];
    summary?: string | undefined;
    suggestedActions?: string[] | undefined;
}, {
    approved: boolean;
    checks: {
        claim: string;
        supported: boolean;
        reason?: string | undefined;
        evidenceId?: string | undefined;
        evidenceType?: "tool_result" | "chunk" | undefined;
    }[];
    summary?: string | undefined;
    suggestedActions?: string[] | undefined;
}>;
export type EvidenceCheck = z.infer<typeof EvidenceCheckSchema>;
export type VerifierReport = z.infer<typeof VerifierReportSchema>;
//# sourceMappingURL=verifier-report.d.ts.map