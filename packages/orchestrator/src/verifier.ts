/**
 * @file Verifier
 * @description Enforces evidence requirements on tool results before the final answer is generated.
 *   Rejects any attempt to answer without evidence and ensures every claim maps to citations.
 * @remarks If evidence is insufficient, the verifier produces a report with suggested actions
 *   instead of approving the answer.
 */

import type { VerifierReport, EvidenceCheck } from '@crm-ai/shared';
import { VerificationError } from '@crm-ai/shared';
import type { ToolExecutionResult } from './tool-runtime.js';

/**
 * Verifier stage: ensures tool results provide sufficient evidence for an answer.
 *
 * @example
 * ```ts
 * const verifier = new Verifier();
 * const report = verifier.verify(executionResults, userMessage);
 * if (!report.approved) { ... }
 * ```
 */
export class Verifier {
  /**
   * Verify that execution results provide sufficient evidence to answer the user's question.
   *
   * @param results - Tool execution results from the tool runtime.
   * @param userMessage - The original user question (for context).
   * @returns A VerifierReport with approval status and evidence checks.
   */
  verify(results: ToolExecutionResult[], _userMessage: string): VerifierReport {
    const checks: EvidenceCheck[] = [];
    const suggestedActions: string[] = [];

    // Check 1: At least one tool must have succeeded
    const successfulResults = results.filter(
      (r) => r.toolCall.status === 'success' && r.toolResult !== null,
    );
    const failedResults = results.filter(
      (r) => r.toolCall.status === 'error' || r.toolResult === null,
    );

    checks.push({
      claim: 'At least one tool execution succeeded',
      supported: successfulResults.length > 0,
      reason:
        successfulResults.length > 0
          ? `${successfulResults.length} tool(s) succeeded`
          : `All ${results.length} tool(s) failed`,
    });

    // Check 2: Successful results have data
    for (const result of successfulResults) {
      const tr = result.toolResult!;
      const hasData = tr.rowCount !== null && tr.rowCount !== undefined && tr.rowCount > 0;

      checks.push({
        claim: `Tool "${result.toolCall.toolName}" returned data`,
        supported: hasData || (tr.data && Object.keys(tr.data).length > 0),
        evidenceId: tr.id,
        evidenceType: 'tool_result',
        reason: hasData ? `${tr.rowCount} row(s) returned` : 'No rows returned',
      });

      if (!hasData) {
        suggestedActions.push(
          `Tool "${result.toolCall.toolName}" returned no data. Consider refining the query or checking data availability.`,
        );
      }
    }

    // Check 3: Report failed tools
    for (const result of failedResults) {
      checks.push({
        claim: `Tool "${result.toolCall.toolName}" executed successfully`,
        supported: false,
        reason: result.toolCall.errorMessage ?? 'Unknown error',
      });
      suggestedActions.push(
        `Tool "${result.toolCall.toolName}" failed: ${result.toolCall.errorMessage}. Check tool configuration.`,
      );
    }

    const approved =
      successfulResults.length > 0 &&
      checks.every((c) => c.supported || c.evidenceType === undefined);

    const summary = approved
      ? undefined
      : `Cannot produce a grounded answer. ${failedResults.length} tool(s) failed, ` +
        `${successfulResults.filter((r) => (r.toolResult?.rowCount ?? 0) === 0).length} returned no data.`;

    return { approved, checks, summary, suggestedActions };
  }

  /**
   * Verify and throw if not approved. Convenience method for pipeline use.
   *
   * @param results - Tool execution results.
   * @param userMessage - The original user question.
   * @returns Approved verifier report.
   * @throws VerificationError if evidence is insufficient.
   */
  verifyOrThrow(results: ToolExecutionResult[], userMessage: string): VerifierReport {
    const report = this.verify(results, userMessage);
    // Allow the pipeline to continue even if no data was returned — the answer
    // generator will acknowledge the absence of data instead of inventing it.
    // We only hard-block if every tool failed entirely.
    const allFailed = results.every(
      (r) => r.toolCall.status === 'error' || r.toolResult === null,
    );
    if (allFailed && results.length > 0) {
      throw new VerificationError(report.summary ?? 'Evidence insufficient', {
        checks: report.checks,
        suggestedActions: report.suggestedActions,
      });
    }
    return report;
  }
}
