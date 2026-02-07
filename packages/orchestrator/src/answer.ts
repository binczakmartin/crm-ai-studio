/**
 * @file Answer Generator
 * @description Generates the final grounded answer from tool results and the verifier report.
 *   Consumes ONLY tool results + retrieved chunks and returns an Answer with citations.
 * @remarks Un-cited numbers or factual assertions are forbidden.
 */

import type { LlmAdapter } from '@crm-ai/shared';
import type { Answer, ToolResult, VerifierReport } from '@crm-ai/shared';

/**
 * Answer generator stage: produces the final grounded response.
 *
 * @example
 * ```ts
 * const generator = new AnswerGenerator(llm);
 * const answer = await generator.generate(toolResults, verifierReport, userMessage, systemContext);
 * ```
 */
export class AnswerGenerator {
  private readonly llm: LlmAdapter;

  constructor(llm: LlmAdapter) {
    this.llm = llm;
  }

  /**
   * Generate a grounded answer from tool results.
   *
   * @param toolResults - Structured results from tool execution.
   * @param verifierReport - The verifier's evidence assessment.
   * @param userMessage - The original user question.
   * @param systemContext - System context for the LLM.
   * @returns A validated Answer object with content and citations.
   */
  async generate(
    toolResults: ToolResult[],
    verifierReport: VerifierReport,
    userMessage: string,
    systemContext: string,
  ): Promise<Answer> {
    return this.llm.generateAnswer({
      userMessage,
      toolResults,
      verifierReport,
      systemContext,
    });
  }

  /**
   * Stream the answer token by token (for SSE).
   *
   * @param toolResults - Tool results for grounding.
   * @param verifierReport - Verifier report.
   * @param userMessage - Original user question.
   * @param systemContext - System context.
   * @yields String tokens of the answer content.
   */
  async *stream(
    toolResults: ToolResult[],
    verifierReport: VerifierReport,
    userMessage: string,
    systemContext: string,
  ): AsyncGenerator<string, void, unknown> {
    yield* this.llm.streamAnswer({
      userMessage,
      toolResults,
      verifierReport,
      systemContext,
    });
  }
}
