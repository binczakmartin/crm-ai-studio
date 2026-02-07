/**
 * @file Policy Engine
 * @description Validates plans against safety policies before tool execution. Combines tool gating
 *   and SQL safety into a single validation pass.
 * @remarks All plans must pass policy validation. Blocked plans produce clear, actionable errors.
 */

import { SqlPolicy, ToolGate, type SqlPolicyConfig, type ToolGateConfig } from '@crm-ai/policies';
import type { Plan, PlanAction } from '@crm-ai/shared';

/** Configuration for the policy engine. */
export interface PolicyEngineConfig {
  sqlPolicy: Partial<SqlPolicyConfig>;
  toolGate: Partial<ToolGateConfig>;
}

/** Result of policy validation for a single action. */
export interface PolicyResult {
  action: PlanAction;
  approved: boolean;
  sanitizedArgs?: Record<string, unknown>;
  errors: string[];
}

/**
 * Policy engine that gates all planned tool actions.
 *
 * @example
 * ```ts
 * const policy = new PolicyEngine({ sqlPolicy: { maxRows: 200 }, toolGate: {} });
 * const results = policy.validatePlan(plan);
 * ```
 */
export class PolicyEngine {
  private readonly sqlPolicy: SqlPolicy;
  private readonly toolGate: ToolGate;

  constructor(config: Partial<PolicyEngineConfig> = {}) {
    this.sqlPolicy = new SqlPolicy(config.sqlPolicy);
    this.toolGate = new ToolGate(config.toolGate);
  }

  /**
   * Validate all actions in a plan.
   *
   * @param plan - The plan to validate.
   * @returns Array of policy results for each action.
   * @throws PolicyBlockedError if tool gating fails (invalid tools or too many calls).
   */
  validatePlan(plan: Plan): PolicyResult[] {
    // First: tool gating (validates allowed tools and count)
    this.toolGate.validateActions(plan.actions);

    // Then: per-action validation
    return plan.actions.map((action) => this.validateAction(action));
  }

  /**
   * Validate a single action.
   *
   * @param action - The planned tool action.
   * @returns Policy result with approval status and sanitized args.
   */
  private validateAction(action: PlanAction): PolicyResult {
    const errors: string[] = [];
    let sanitizedArgs = { ...action.args };

    // SQL-specific validation
    if (action.tool === 'sql.query') {
      const sql = action.args['sql'];
      if (typeof sql !== 'string') {
        errors.push('sql.query requires a "sql" argument of type string.');
        return { action, approved: false, errors };
      }

      const result = this.sqlPolicy.validate(sql);
      if (!result.valid) {
        return { action, approved: false, errors: result.errors };
      }

      // Use the sanitized SQL (with forced LIMIT)
      sanitizedArgs = { ...action.args, sql: result.sanitizedSql };
    }

    return { action, approved: true, sanitizedArgs, errors };
  }

  /** Get the tool timeout configuration. */
  getToolTimeoutMs(): number {
    return this.toolGate.getTimeoutMs();
  }
}
