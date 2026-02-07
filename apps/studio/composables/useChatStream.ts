/**
 * @file Chat SSE Composable
 * @description Manages SSE streaming for the chat interface. Handles connection lifecycle,
 *   event parsing, state management, and smart auto-scroll.
 * @remarks Provides reactive state for the chat UI: messages, tool calls, status, and errors.
 */

import { ref, type Ref } from 'vue';

/** Chat pipeline status. */
export type ChatStatus = 'idle' | 'typing' | 'planning' | 'toolsRunning' | 'verifying' | 'answering' | 'done' | 'error';

/** Tool call event data from the pipeline. */
export interface ToolCallEvent {
  tool: string;
  args?: Record<string, unknown>;
  status?: string;
  durationMs?: number;
  rowCount?: number;
  error?: string;
}

/** Evidence data collected during pipeline execution. */
export interface EvidenceData {
  plan?: Record<string, unknown>;
  toolCalls: ToolCallEvent[];
  verification?: Record<string, unknown>;
  answer?: { content: string; citations: unknown[] };
}

/**
 * Composable for SSE chat streaming.
 *
 * @returns Reactive chat state and methods.
 */
export function useChatStream() {
  const status: Ref<ChatStatus> = ref('idle');
  const streamedContent = ref('');
  const evidence: Ref<EvidenceData> = ref({ toolCalls: [] });
  const error: Ref<string | null> = ref(null);
  const threadId: Ref<string | null> = ref(null);

  /**
   * Send a message and stream the response via SSE.
   *
   * @param content - The user's message text.
   * @param workspaceId - The workspace ID.
   * @param existingThreadId - Optional existing thread ID to continue.
   */
  async function sendMessage(content: string, workspaceId: string, existingThreadId?: string) {
    // Reset state
    status.value = 'typing';
    streamedContent.value = '';
    evidence.value = { toolCalls: [] };
    error.value = null;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          workspaceId,
          threadId: existingThreadId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              handleEvent(eventType, data);
            } catch {
              // Ignore parse errors in SSE data
            }
            eventType = '';
          }
        }
      }

      if (status.value !== 'error') {
        status.value = 'done';
      }
    } catch (err) {
      error.value = (err as Error).message;
      status.value = 'error';
    }
  }

  /** Handle a single SSE event. */
  function handleEvent(eventType: string, data: unknown) {
    const d = data as Record<string, unknown>;

    switch (eventType) {
      case 'meta':
        threadId.value = d.threadId as string;
        break;

      case 'status':
        {
          const stage = d.stage as string;
          if (stage === 'planning') status.value = 'planning';
          else if (stage === 'policy') status.value = 'planning';
          else if (stage === 'toolsRunning') status.value = 'toolsRunning';
          else if (stage === 'verifying') status.value = 'verifying';
          else if (stage === 'answering') status.value = 'answering';
        }
        break;

      case 'plan':
        evidence.value.plan = d;
        break;

      case 'tool_call_start':
        evidence.value.toolCalls.push({
          tool: d.tool as string,
          args: d.args as Record<string, unknown>,
        });
        break;

      case 'tool_call_end':
        {
          const last = evidence.value.toolCalls[evidence.value.toolCalls.length - 1];
          if (last) {
            last.status = d.status as string;
            last.durationMs = d.durationMs as number;
            last.rowCount = d.rowCount as number;
            last.error = d.error as string;
          }
        }
        break;

      case 'verification':
        evidence.value.verification = d;
        break;

      case 'token':
        streamedContent.value += (d.token as string) ?? '';
        break;

      case 'answer':
        evidence.value.answer = d as EvidenceData['answer'];
        if (d.content) {
          streamedContent.value = d.content as string;
        }
        break;

      case 'error':
        error.value = d.message as string;
        status.value = 'error';
        break;

      case 'done':
        status.value = 'done';
        break;
    }
  }

  /** Reset the chat state for a new conversation. */
  function reset() {
    status.value = 'idle';
    streamedContent.value = '';
    evidence.value = { toolCalls: [] };
    error.value = null;
    threadId.value = null;
  }

  return {
    status,
    streamedContent,
    evidence,
    error,
    threadId,
    sendMessage,
    reset,
  };
}
