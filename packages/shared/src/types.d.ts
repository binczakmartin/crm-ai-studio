/**
 * @file Shared Types
 * @description Utility types and interfaces shared across the monorepo.
 * @remarks These are non-schema types: interfaces for connectors, LLM adapters, and pipeline stages.
 */
import type { Plan } from './schemas/plan.js';
import type { ToolResult } from './schemas/tool-result.js';
import type { Answer } from './schemas/answer.js';
import type { VerifierReport } from './schemas/verifier-report.js';
/** LLM adapter interface — abstraction over Ollama, OpenAI, or mock. */
export interface LlmAdapter {
    /** Generate a structured Plan JSON from a user message. */
    generatePlan(params: LlmPlanRequest): Promise<Plan>;
    /** Generate a grounded final answer from tool results. */
    generateAnswer(params: LlmAnswerRequest): Promise<Answer>;
    /** Stream tokens for the final answer (SSE). */
    streamAnswer(params: LlmAnswerRequest): AsyncGenerator<string, void, unknown>;
}
export interface LlmPlanRequest {
    userMessage: string;
    systemContext: string;
    allowedTools: string[];
    temperature?: number;
}
export interface LlmAnswerRequest {
    userMessage: string;
    toolResults: ToolResult[];
    verifierReport: VerifierReport;
    systemContext: string;
}
/** SQL connector interface. */
export interface SqlConnector {
    /** Execute a read-only SQL query and return structured results. */
    query(params: SqlQueryParams): Promise<SqlQueryResult>;
    /** Test connection to the source. */
    testConnection(): Promise<{
        ok: boolean;
        error?: string;
    }>;
    /** Disconnect / cleanup. */
    disconnect(): Promise<void>;
}
export interface SqlQueryParams {
    sql: string;
    sourceId: string;
    workspaceId: string;
    maxRows?: number;
}
export interface SqlQueryResult {
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
    checksum: string;
    truncated: boolean;
}
/** RAG connector interface. */
export interface RagConnector {
    /** Search for relevant chunks. */
    search(params: RagSearchParams): Promise<RagSearchResult>;
}
export interface RagSearchParams {
    query: string;
    workspaceId: string;
    sourceIds?: string[];
    topK?: number;
}
export interface RagSearchResult {
    chunks: RagChunk[];
}
export interface RagChunk {
    chunkId: string;
    documentId: string;
    content: string;
    score: number;
    metadata: Record<string, unknown>;
}
/** SSE event types for chat streaming. */
export type SseEventType = 'status' | 'plan' | 'tool_call_start' | 'tool_call_end' | 'verification' | 'token' | 'answer' | 'error' | 'done';
export interface SseEvent {
    event: SseEventType;
    data: unknown;
}
/** Pipeline context passed through each stage. */
export interface PipelineContext {
    workspaceId: string;
    threadId: string;
    messageId: string;
    userMessage: string;
    allowedSources: string[];
}
//# sourceMappingURL=types.d.ts.map