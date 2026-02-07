/**
 * @file Tool Runtime
 * @description Executes real tool calls (SQL, RAG, etc.) and persists results with checksums
 *   and row counts. Tracks timing and status for each call.
 * @remarks Never fabricates tool results. If execution fails, stores failure with reason.
 *   Every tool call has a unique ID for audit and citation traceability.
 */

import { createHash } from 'node:crypto';
import type {
  SqlConnector,
  RagConnector,
  PipelineContext,
} from '@crm-ai/shared';
import type { ToolCall, ToolResult, PlanAction } from '@crm-ai/shared';
import { ToolExecutionError } from '@crm-ai/shared';

/** Registry of available tool connectors. */
export interface ToolConnectors {
  sql?: SqlConnector;
  rag?: RagConnector;
}

/** Execution result for a single tool call. */
export interface ToolExecutionResult {
  toolCall: ToolCall;
  toolResult: ToolResult | null;
}

/**
 * Tool runtime: executes planned actions and produces structured results.
 *
 * @example
 * ```ts
 * const runtime = new ToolRuntime({ sql: pgConnector, rag: ragStub });
 * const results = await runtime.executeActions(actions, context, timeoutMs);
 * ```
 */
export class ToolRuntime {
  private readonly connectors: ToolConnectors;

  constructor(connectors: ToolConnectors) {
    this.connectors = connectors;
  }

  /**
   * Execute a list of planned tool actions sequentially.
   *
   * @param actions - Planned actions (with sanitized args from policy engine).
   * @param context - Pipeline context (workspace, thread, message IDs).
   * @param timeoutMs - Per-tool execution timeout.
   * @returns Array of execution results with tool calls and tool results.
   */
  async executeActions(
    actions: Array<{ action: PlanAction; sanitizedArgs?: Record<string, unknown> }>,
    context: PipelineContext,
    timeoutMs: number,
  ): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const { action, sanitizedArgs } of actions) {
      const result = await this.executeOne(action, sanitizedArgs ?? action.args, context, timeoutMs);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a single tool action.
   */
  private async executeOne(
    action: PlanAction,
    args: Record<string, unknown>,
    context: PipelineContext,
    timeoutMs: number,
  ): Promise<ToolExecutionResult> {
    const toolCallId = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    const toolCall: ToolCall = {
      id: toolCallId,
      threadId: context.threadId,
      workspaceId: context.workspaceId,
      messageId: context.messageId,
      toolName: action.tool,
      toolArgs: args,
      status: 'running',
      startedAt,
      finishedAt: null,
      durationMs: null,
      errorMessage: null,
      createdAt: startedAt,
    };

    try {
      const result = await this.executeWithTimeout(action.tool, args, context, timeoutMs);

      const finishedAt = new Date().toISOString();
      const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();

      toolCall.status = 'success';
      toolCall.finishedAt = finishedAt;
      toolCall.durationMs = durationMs;

      const checksum = createHash('sha256')
        .update(JSON.stringify(result.data))
        .digest('hex')
        .slice(0, 16);

      const toolResult: ToolResult = {
        id: crypto.randomUUID(),
        toolCallId,
        threadId: context.threadId,
        workspaceId: context.workspaceId,
        data: result.data,
        rowCount: result.rowCount,
        checksum,
        previewRows: result.previewRows,
        createdAt: finishedAt,
      };

      return { toolCall, toolResult };
    } catch (err) {
      const finishedAt = new Date().toISOString();
      const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();

      toolCall.status = 'error';
      toolCall.finishedAt = finishedAt;
      toolCall.durationMs = durationMs;
      toolCall.errorMessage = (err as Error).message;

      return { toolCall, toolResult: null };
    }
  }

  /**
   * Execute a tool with a timeout wrapper.
   */
  private async executeWithTimeout(
    toolName: string,
    args: Record<string, unknown>,
    context: PipelineContext,
    timeoutMs: number,
  ): Promise<{ data: Record<string, unknown>; rowCount?: number; previewRows?: Record<string, unknown>[] }> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ToolExecutionError(`Tool ${toolName} timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    const executionPromise = this.dispatch(toolName, args, context);

    return Promise.race([executionPromise, timeoutPromise]);
  }

  /**
   * Dispatch a tool call to the appropriate connector.
   */
  private async dispatch(
    toolName: string,
    args: Record<string, unknown>,
    context: PipelineContext,
  ): Promise<{ data: Record<string, unknown>; rowCount?: number; previewRows?: Record<string, unknown>[] }> {
    switch (toolName) {
      case 'sql.query': {
        if (!this.connectors.sql) {
          throw new ToolExecutionError('SQL connector not configured.');
        }
        const sql = args['sql'] as string;
        const result = await this.connectors.sql.query({
          sql,
          sourceId: (args['sourceId'] as string) ?? context.allowedSources[0] ?? '',
          workspaceId: context.workspaceId,
          maxRows: (args['maxRows'] as number) ?? 200,
        });
        return {
          data: {
            columns: result.columns,
            rows: result.rows,
            rowCount: result.rowCount,
            checksum: result.checksum,
            truncated: result.truncated,
          },
          rowCount: result.rowCount,
          previewRows: result.rows.slice(0, 10),
        };
      }

      case 'rag.search': {
        if (!this.connectors.rag) {
          throw new ToolExecutionError('RAG connector not configured.');
        }
        const result = await this.connectors.rag.search({
          query: args['query'] as string,
          workspaceId: context.workspaceId,
          topK: (args['topK'] as number) ?? 8,
        });
        return {
          data: { chunks: result.chunks },
          rowCount: result.chunks.length,
        };
      }

      default:
        throw new ToolExecutionError(`Unknown tool: ${toolName}`);
    }
  }
}
