/**
 * @file Shared Error Classes
 * @description Custom error classes for the CRM AI Studio pipeline. Provides structured, actionable
 *   errors that can be serialized for API responses and UI display.
 * @remarks All errors include a machine-readable code and human-readable message.
 */

/** Base error for the CRM AI Studio pipeline. */
export class PipelineError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode = 500,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'PipelineError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /** Serialize for API responses. */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/** Planner failed to produce valid Plan JSON. */
export class PlannerError extends PipelineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('PLANNER_ERROR', message, 422, details);
    this.name = 'PlannerError';
  }
}

/** Policy engine blocked a tool call. */
export class PolicyBlockedError extends PipelineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('POLICY_BLOCKED', message, 403, details);
    this.name = 'PolicyBlockedError';
  }
}

/** SQL safety check failed. */
export class SqlSafetyError extends PipelineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('SQL_SAFETY_ERROR', message, 403, { ...details, tool: 'sql.query' });
    this.name = 'SqlSafetyError';
  }
}

/** Tool execution failed. */
export class ToolExecutionError extends PipelineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('TOOL_EXECUTION_ERROR', message, 500, details);
    this.name = 'ToolExecutionError';
  }
}

/** Verifier rejected the answer due to insufficient evidence. */
export class VerificationError extends PipelineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VERIFICATION_ERROR', message, 422, details);
    this.name = 'VerificationError';
  }
}

/** Source not found or not accessible. */
export class SourceNotFoundError extends PipelineError {
  constructor(sourceId: string) {
    super('SOURCE_NOT_FOUND', `Source ${sourceId} not found`, 404, { sourceId });
    this.name = 'SourceNotFoundError';
  }
}
