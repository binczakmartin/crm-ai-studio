/**
 * @file Pipeline
 * @description The main orchestrator pipeline: Plan JSON → Policy → Tools → Verify → Answer.
 *   Coordinates all stages and streams events via SSE for the Studio UI.
 * @remarks This is the core engine of the CRM AI Studio. All stages are composable and testable.
 */

import type {
  LlmAdapter,
  SqlConnector,
  RagConnector,
  PipelineContext,
  SseEvent,
  ToolResult,
} from '@crm-ai/shared';
import type { ToolCall, Answer, VerifierReport, Plan } from '@crm-ai/shared';
import { Planner } from './planner.js';
import { PolicyEngine } from './policy.js';
import { ToolRuntime, type ToolExecutionResult } from './tool-runtime.js';
import { Verifier } from './verifier.js';
import { AnswerGenerator } from './answer.js';

/** Pipeline configuration. */
export interface PipelineConfig {
  llm: LlmAdapter;
  sql?: SqlConnector;
  rag?: RagConnector;
  maxRows?: number;
  allowedTables?: string[];
  allowedTools?: string[];
  toolTimeoutMs?: number;
  plannerTemperature?: number;
  plannerMaxRetries?: number;
}

/** Full pipeline execution result. */
export interface PipelineResult {
  plan: Plan;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  verifierReport: VerifierReport;
  answer: Answer;
}

/**
 * The main CRM AI Studio orchestration pipeline.
 *
 * Enforces the evidence-first workflow:
 * 1. Planner → Plan JSON
 * 2. Policy Engine → validates plan
 * 3. Tool Runtime → executes tools
 * 4. Verifier → checks evidence
 * 5. Answer Generator → grounded response with citations
 *
 * @example
 * ```ts
 * const pipeline = new Pipeline({ llm: mockLlm, sql: pgConnector });
 * const result = await pipeline.run(context);
 * // or stream:
 * for await (const event of pipeline.stream(context)) { ... }
 * ```
 */
export class Pipeline {
  private readonly planner: Planner;
  private readonly policyEngine: PolicyEngine;
  private readonly toolRuntime: ToolRuntime;
  private readonly verifier: Verifier;
  private readonly answerGenerator: AnswerGenerator;
  private readonly config: PipelineConfig;

  constructor(config: PipelineConfig) {
    this.config = config;

    this.planner = new Planner({
      llm: config.llm,
      temperature: config.plannerTemperature ?? 0.1,
      maxRetries: config.plannerMaxRetries ?? 2,
    });

    this.policyEngine = new PolicyEngine({
      sqlPolicy: {
        maxRows: config.maxRows ?? 200,
        allowedTables: config.allowedTables ?? [],
        allowedColumns: [],
        forbiddenFunctions: [],
      },
      toolGate: {
        allowedTools: config.allowedTools ?? ['sql.query', 'rag.search'],
        toolTimeoutMs: config.toolTimeoutMs ?? 30_000,
      },
    });

    this.toolRuntime = new ToolRuntime({
      sql: config.sql,
      rag: config.rag,
    });

    this.verifier = new Verifier();
    this.answerGenerator = new AnswerGenerator(config.llm);
  }

  /**
   * Run the full pipeline (non-streaming).
   *
   * @param context - Pipeline context with workspace, thread, and message info.
   * @returns Full pipeline result with plan, tool calls, results, report, and answer.
   */
  async run(context: PipelineContext): Promise<PipelineResult> {
    const systemContext = this.buildSystemContext(context);

    // Stage 1: Plan
    const plan = await this.planner.plan(
      context.userMessage,
      systemContext,
      this.config.allowedTools ?? ['sql.query', 'rag.search'],
    );

    // Handle clarification requests
    if (plan.needsClarification) {
      return {
        plan,
        toolCalls: [],
        toolResults: [],
        verifierReport: { approved: false, checks: [], summary: plan.clarificationQuestion },
        answer: {
          content: plan.clarificationQuestion ?? 'Could you clarify your question?',
          citations: [],
        },
      };
    }

    // Stage 2: Policy
    const policyResults = this.policyEngine.validatePlan(plan);
    const blockedActions = policyResults.filter((r) => !r.approved);
    if (blockedActions.length === policyResults.length) {
      const errors = blockedActions.flatMap((r) => r.errors);
      return {
        plan,
        toolCalls: [],
        toolResults: [],
        verifierReport: { approved: false, checks: [], summary: `Policy blocked: ${errors.join('; ')}` },
        answer: {
          content: `Your query was blocked by the safety policy: ${errors.join('; ')}. Please adjust your question.`,
          citations: [],
        },
      };
    }

    // Stage 3: Tool execution
    const approvedActions = policyResults
      .filter((r) => r.approved)
      .map((r) => ({ action: r.action, sanitizedArgs: r.sanitizedArgs }));

    const executionResults = await this.toolRuntime.executeActions(
      approvedActions,
      context,
      this.policyEngine.getToolTimeoutMs(),
    );

    const toolCalls = executionResults.map((r) => r.toolCall);
    const toolResults = executionResults
      .filter((r) => r.toolResult !== null)
      .map((r) => r.toolResult!);

    // Stage 4: Verify
    const verifierReport = this.verifier.verify(executionResults, context.userMessage);

    // Stage 5: Answer
    const answer = await this.answerGenerator.generate(
      toolResults,
      verifierReport,
      context.userMessage,
      systemContext,
    );

    return { plan, toolCalls, toolResults, verifierReport, answer };
  }

  /**
   * Stream the pipeline execution as SSE events.
   *
   * @param context - Pipeline context.
   * @yields SseEvent objects for each pipeline stage.
   */
  async *stream(context: PipelineContext): AsyncGenerator<SseEvent, void, unknown> {
    const systemContext = this.buildSystemContext(context);

    // Status: planning
    yield { event: 'status', data: { stage: 'planning' } };

    // Stage 1: Plan
    let plan: Plan;
    try {
      plan = await this.planner.plan(
        context.userMessage,
        systemContext,
        this.config.allowedTools ?? ['sql.query', 'rag.search'],
      );
      yield { event: 'plan', data: plan };
    } catch (err) {
      yield { event: 'error', data: { message: (err as Error).message, stage: 'planning' } };
      yield { event: 'done', data: {} };
      return;
    }

    // Handle clarification
    if (plan.needsClarification) {
      yield {
        event: 'answer',
        data: {
          content: plan.clarificationQuestion ?? 'Could you clarify your question?',
          citations: [],
        },
      };
      yield { event: 'done', data: {} };
      return;
    }

    // Stage 2: Policy
    yield { event: 'status', data: { stage: 'policy' } };
    let policyResults;
    try {
      policyResults = this.policyEngine.validatePlan(plan);
    } catch (err) {
      yield { event: 'error', data: { message: (err as Error).message, stage: 'policy' } };
      yield { event: 'done', data: {} };
      return;
    }

    const approvedActions = policyResults.filter((r) => r.approved);
    if (approvedActions.length === 0) {
      const errors = policyResults.flatMap((r) => r.errors);
      yield { event: 'error', data: { message: `Policy blocked: ${errors.join('; ')}`, stage: 'policy' } };
      yield { event: 'done', data: {} };
      return;
    }

    // Stage 3: Tool execution
    yield { event: 'status', data: { stage: 'toolsRunning' } };
    const executionResults: ToolExecutionResult[] = [];
    for (const policyResult of approvedActions) {
      yield {
        event: 'tool_call_start',
        data: { tool: policyResult.action.tool, args: policyResult.sanitizedArgs ?? policyResult.action.args },
      };

      const results = await this.toolRuntime.executeActions(
        [{ action: policyResult.action, sanitizedArgs: policyResult.sanitizedArgs }],
        context,
        this.policyEngine.getToolTimeoutMs(),
      );

      for (const result of results) {
        executionResults.push(result);
        yield {
          event: 'tool_call_end',
          data: {
            tool: result.toolCall.toolName,
            status: result.toolCall.status,
            durationMs: result.toolCall.durationMs,
            rowCount: result.toolResult?.rowCount ?? 0,
            error: result.toolCall.errorMessage,
          },
        };
      }
    }

    const toolResults = executionResults
      .filter((r) => r.toolResult !== null)
      .map((r) => r.toolResult!);

    // Stage 4: Verify
    yield { event: 'status', data: { stage: 'verifying' } };
    const verifierReport = this.verifier.verify(executionResults, context.userMessage);
    yield { event: 'verification', data: verifierReport };

    // Stage 5: Stream answer
    yield { event: 'status', data: { stage: 'answering' } };
    try {
      const answerChunks: string[] = [];
      for await (const token of this.answerGenerator.stream(
        toolResults,
        verifierReport,
        context.userMessage,
        systemContext,
      )) {
        answerChunks.push(token);
        yield { event: 'token', data: { token } };
      }

      // Generate full answer for citations
      const answer = await this.answerGenerator.generate(
        toolResults,
        verifierReport,
        context.userMessage,
        systemContext,
      );
      yield { event: 'answer', data: answer };
    } catch (err) {
      yield { event: 'error', data: { message: (err as Error).message, stage: 'answering' } };
    }

    yield { event: 'done', data: {} };
  }

  /** Build system context string for the LLM. */
  private buildSystemContext(context: PipelineContext): string {
    return [
      'You are the CRM AI Studio assistant.',
      `Workspace: ${context.workspaceId}`,
      `Thread: ${context.threadId}`,
      'Rules:',
      '- Answer ONLY from tool results and evidence.',
      '- Every factual claim must have a citation.',
      '- Never invent numbers, totals, or query results.',
      '- If data is insufficient, say so clearly.',
    ].join('\n');
  }
}
