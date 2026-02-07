/**
 * @file Chat Stream SSE Endpoint
 * @description POST /api/chat/stream — Accepts a user message, runs the orchestrator pipeline,
 *   and streams events (plan, tool calls, verification, tokens, answer) via SSE.
 * @remarks Persists messages and evidence references to the database. Uses EventStream for SSE.
 */

import { createError, readBody, setResponseHeader } from 'h3';
import { CreateMessageSchema } from '@crm-ai/shared';
import { query } from '../../utils/db';
import { createPipeline } from '../../utils/pipeline';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Parse and validate request body
  const body = await readBody(event);
  const parsed = CreateMessageSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: `Invalid request: ${parsed.error.message}`,
    });
  }

  const { content, workspaceId, threadId: requestThreadId } = parsed.data;

  // Create or use thread
  let threadId = requestThreadId;
  if (!threadId) {
    const result = await query(
      config.databaseUrl,
      'INSERT INTO threads (workspace_id, title) VALUES ($1, $2) RETURNING id',
      [workspaceId, content.slice(0, 100)],
    );
    threadId = result.rows[0].id;
  }

  // Persist user message
  const userMsgResult = await query(
    config.databaseUrl,
    'INSERT INTO messages (thread_id, workspace_id, role, content) VALUES ($1, $2, $3, $4) RETURNING id',
    [threadId, workspaceId, 'user', content],
  );
  const messageId = userMsgResult.rows[0].id;

  // Fetch source connection string (use first active source if available)
  const sourcesResult = await query(
    config.databaseUrl,
    "SELECT config FROM sources WHERE workspace_id = $1 AND status = 'active' AND type = 'postgres' LIMIT 1",
    [workspaceId],
  );

  let sourceConnectionString: string | undefined;
  if (sourcesResult.rows.length > 0) {
    const srcConfig = sourcesResult.rows[0].config;
    if (srcConfig && typeof srcConfig === 'object') {
      const c = srcConfig as Record<string, unknown>;
      sourceConnectionString = `postgresql://${c.user}:${c.password}@${c.host}:${c.port}/${c.database}`;
    }
  }

  // Create pipeline
  const pipeline = createPipeline(config, sourceConnectionString);

  // Set SSE headers
  setResponseHeader(event, 'Content-Type', 'text/event-stream');
  setResponseHeader(event, 'Cache-Control', 'no-cache');
  setResponseHeader(event, 'Connection', 'keep-alive');
  setResponseHeader(event, 'X-Accel-Buffering', 'no');

  // Stream pipeline events
  const responseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (eventType: string, data: unknown) => {
        const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Send thread info
      send('meta', { threadId, messageId });

      try {
        const context = {
          workspaceId,
          threadId,
          messageId,
          userMessage: content,
          allowedSources: [],
        };

        for await (const sseEvent of pipeline.stream(context)) {
          send(sseEvent.event, sseEvent.data);

          // Persist tool calls and results as they come
          if (sseEvent.event === 'tool_call_end') {
            const toolData = sseEvent.data as Record<string, unknown>;
            try {
              await query(
                config.databaseUrl,
                `INSERT INTO tool_calls (thread_id, workspace_id, message_id, tool_name, tool_args, status, duration_ms, error_message)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                  threadId,
                  workspaceId,
                  messageId,
                  toolData.tool,
                  JSON.stringify(toolData.args ?? {}),
                  toolData.status,
                  toolData.durationMs ?? null,
                  toolData.error ?? null,
                ],
              );
            } catch {
              // Best effort persistence
            }
          }

          // Persist assistant answer
          if (sseEvent.event === 'answer') {
            const answer = sseEvent.data as { content: string; citations: unknown[] };
            try {
              await query(
                config.databaseUrl,
                'INSERT INTO messages (thread_id, workspace_id, role, content, citations) VALUES ($1, $2, $3, $4, $5)',
                [threadId, workspaceId, 'assistant', answer.content, JSON.stringify(answer.citations)],
              );
            } catch {
              // Best effort persistence
            }
          }
        }
      } catch (err) {
        send('error', { message: (err as Error).message });
      }

      controller.close();
    },
  });

  return new Response(responseStream);
});
