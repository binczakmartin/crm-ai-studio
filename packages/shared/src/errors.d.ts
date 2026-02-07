/**
 * @file Shared Error Classes
 * @description Custom error classes for the CRM AI Studio pipeline. Provides structured, actionable
 *   errors that can be serialized for API responses and UI display.
 * @remarks All errors include a machine-readable code and human-readable message.
 */
/** Base error for the CRM AI Studio pipeline. */
export declare class PipelineError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: Record<string, unknown>;
    constructor(code: string, message: string, statusCode?: number, details?: Record<string, unknown>);
    /** Serialize for API responses. */
    toJSON(): {
        error: {
            code: string;
            message: string;
            details: Record<string, unknown> | undefined;
        };
    };
}
/** Planner failed to produce valid Plan JSON. */
export declare class PlannerError extends PipelineError {
    constructor(message: string, details?: Record<string, unknown>);
}
/** Policy engine blocked a tool call. */
export declare class PolicyBlockedError extends PipelineError {
    constructor(message: string, details?: Record<string, unknown>);
}
/** SQL safety check failed. */
export declare class SqlSafetyError extends PipelineError {
    constructor(message: string, details?: Record<string, unknown>);
}
/** Tool execution failed. */
export declare class ToolExecutionError extends PipelineError {
    constructor(message: string, details?: Record<string, unknown>);
}
/** Verifier rejected the answer due to insufficient evidence. */
export declare class VerificationError extends PipelineError {
    constructor(message: string, details?: Record<string, unknown>);
}
/** Source not found or not accessible. */
export declare class SourceNotFoundError extends PipelineError {
    constructor(sourceId: string);
}
//# sourceMappingURL=errors.d.ts.map