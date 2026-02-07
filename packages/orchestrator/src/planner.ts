/**
 * @file Planner
 * @description Calls the LLM adapter to produce a Plan JSON from the user message. Validates the
 *   output against the Plan schema. Re-asks on invalid output (up to maxRetries).
 * @remarks The planner must NEVER produce user-facing text. Only structured Plan JSON.
 *   Uses low temperature for determinism.
 */

import { PlanSchema, type Plan, PlannerError, type LlmAdapter } from '@crm-ai/shared';

/** Configuration for the planner. */
export interface PlannerConfig {
  /** LLM adapter to use for plan generation. */
  llm: LlmAdapter;
  /** Temperature for planning (low for determinism). */
  temperature: number;
  /** Maximum retries on invalid output. */
  maxRetries: number;
}

/**
 * Planner stage: converts a user message into a validated Plan JSON.
 *
 * @example
 * ```ts
 * const planner = new Planner({ llm: mockLlm, temperature: 0.1, maxRetries: 2 });
 * const plan = await planner.plan(userMessage, systemContext, allowedTools);
 * ```
 */
export class Planner {
  private readonly config: PlannerConfig;

  constructor(config: PlannerConfig) {
    this.config = config;
  }

  /**
   * Generate and validate a Plan from the user message.
   *
   * @param userMessage - The user's natural language question.
   * @param systemContext - Context about the workspace, sources, and schema summary.
   * @param allowedTools - List of allowed tool names.
   * @returns A validated Plan object.
   * @throws PlannerError if the LLM fails to produce valid Plan JSON after retries.
   */
  async plan(userMessage: string, systemContext: string, allowedTools: string[]): Promise<Plan> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const rawPlan = await this.config.llm.generatePlan({
          userMessage,
          systemContext,
          allowedTools,
          temperature: this.config.temperature,
        });

        // Validate against schema
        const parsed = PlanSchema.safeParse(rawPlan);
        if (parsed.success) {
          return parsed.data;
        }

        lastError = new PlannerError(
          `Plan validation failed (attempt ${attempt + 1}): ${parsed.error.message}`,
          { issues: parsed.error.issues },
        );
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw new PlannerError(
      `Planner failed after ${this.config.maxRetries + 1} attempts: ${lastError?.message}`,
      { lastError: lastError?.message },
    );
  }
}
