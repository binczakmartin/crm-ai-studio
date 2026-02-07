/**
 * @file VerifierReport Schema
 * @description Zod schema and TypeScript type for the verifier's output. The verifier ensures that
 *   every claim in the final answer is backed by evidence from tool results or RAG chunks.
 * @remarks If verification fails, the pipeline must NOT produce an answer.
 */
import { z } from 'zod';
/** Schema for a single evidence check within the verifier report. */
export const EvidenceCheckSchema = z.object({
    /** The claim or assertion being verified. */
    claim: z.string(),
    /** Whether the claim is supported by evidence. */
    supported: z.boolean(),
    /** Evidence source ID (tool_result_id or chunk_id). */
    evidenceId: z.string().optional(),
    /** Type of evidence ('tool_result' or 'chunk'). */
    evidenceType: z.enum(['tool_result', 'chunk']).optional(),
    /** Reason for the verdict. */
    reason: z.string().optional(),
});
/** Schema for the full verifier report. */
export const VerifierReportSchema = z.object({
    /** Whether all claims are supported (answer can proceed). */
    approved: z.boolean(),
    /** Individual evidence checks. */
    checks: z.array(EvidenceCheckSchema),
    /** Summary of issues if not approved. */
    summary: z.string().optional(),
    /** Suggested follow-up actions if evidence is insufficient. */
    suggestedActions: z.array(z.string()).optional(),
});
//# sourceMappingURL=verifier-report.js.map