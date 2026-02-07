/**
 * @file Tool Gate
 * @description Validates and gates tool calls against workspace-scoped allowlists, rate limits,
 *   and timeout constraints. Prevents unauthorized or misconfigured tool usage.
 * @remarks Every tool call must pass through the gate before execution.
 */

import { PolicyBlockedError } from '@crm-ai/shared';
import type { PlanAction } from '@crm-ai/shared';

/** Configuration for the tool gate. */
export interface ToolGateConfig {
  /** Allowed tool names for this workspace (empty = all allowed — local dev only). */
  allowedTools: string[];
  /** Timeout per tool call in milliseconds. */
  toolTimeoutMs: number;
  /** Maximum number of tool calls per plan. */
  maxToolCallsPerPlan: number;
}

/** Default tool gate configuration. */
const DEFAULT_CONFIG: ToolGateConfig = {
  allowedTools: ['sql.query', 'rag.search'],
  toolTimeoutMs: 30_000,
  maxToolCallsPerPlan: 10,
};

/**
 * Tool gating engine.
 *
 * Validates planned actions against workspace permissions and safety constraints.
 *
 * @example
 * ```ts
 * const gate = new ToolGate({ allowedTools: ['sql.query'], toolTimeoutMs: 30000, maxToolCallsPerPlan: 5 });
 * gate.validateActions(actions); // throws PolicyBlockedError on violation
 * ```
 */
export class ToolGate {
  private readonly config: ToolGateConfig;

  constructor(config: Partial<ToolGateConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate a list of planned tool actions.
   *
   * @param actions - Planned tool actions from the planner.
   * @throws PolicyBlockedError if any action is not allowed.
   */
  validateActions(actions: PlanAction[]): void {
    // Check max tool calls
    if (actions.length > this.config.maxToolCallsPerPlan) {
      throw new PolicyBlockedError(
        `Plan exceeds maximum tool calls (${actions.length} > ${this.config.maxToolCallsPerPlan}).`,
        { count: actions.length, max: this.config.maxToolCallsPerPlan },
      );
    }

    // Check each action against allowlist
    if (this.config.allowedTools.length > 0) {
      for (const action of actions) {
        if (!this.config.allowedTools.includes(action.tool)) {
          throw new PolicyBlockedError(
            `Tool "${action.tool}" is not allowed. Permitted tools: ${this.config.allowedTools.join(', ')}.`,
            { tool: action.tool, allowedTools: this.config.allowedTools },
          );
        }
      }
    }
  }

  /** Get the configured timeout for tool execution. */
  getTimeoutMs(): number {
    return this.config.toolTimeoutMs;
  }
}
