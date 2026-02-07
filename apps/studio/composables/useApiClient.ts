/**
 * @file API Client Composable
 * @description Typed API client for all Studio API calls. Centralizes fetch logic, error handling,
 *   and response validation.
 * @remarks All API calls go through this composable. Never call $fetch directly from components.
 */

import type { Source, Thread, Message, ToolCall } from '@crm-ai/shared';

interface ApiSourcesResponse { sources: Source[] }
interface ApiThreadsResponse { threads: Thread[] }
interface ApiMessagesResponse { messages: Message[] }
interface ApiToolCallsResponse { toolCalls: ToolCall[] }
interface ApiWorkspacesResponse { workspaces: Array<{ id: string; name: string }> }
interface ApiEvidenceResponse {
  toolCalls: Array<{
    tool: string;
    args: Record<string, unknown>;
    status: string;
    durationMs: number | null;
    rowCount: number | null;
    error: string | null;
  }>;
  verification: Record<string, unknown> | null;
}

/**
 * Composable for typed API calls to the Studio backend.
 */
export function useApiClient() {
  /** Fetch all workspaces. */
  async function fetchWorkspaces(): Promise<ApiWorkspacesResponse> {
    return $fetch('/api/workspaces');
  }

  /** Fetch sources for a workspace. */
  async function fetchSources(workspaceId: string): Promise<ApiSourcesResponse> {
    return $fetch('/api/sources', { query: { workspace_id: workspaceId } });
  }

  /** Create a new source. */
  async function createSource(data: {
    name: string;
    type: string;
    config: Record<string, unknown>;
    workspaceId: string;
  }): Promise<{ source: Source }> {
    return $fetch('/api/sources', { method: 'POST', body: data });
  }

  /** Test a source connection. */
  async function testSourceConnection(data: {
    type: string;
    config: Record<string, unknown>;
  }): Promise<{ ok: boolean; error?: string }> {
    return $fetch('/api/sources/test', { method: 'POST', body: data });
  }

  /** Fetch threads for a workspace. */
  async function fetchThreads(workspaceId: string): Promise<ApiThreadsResponse> {
    return $fetch('/api/threads', { query: { workspace_id: workspaceId } });
  }

  /** Fetch messages for a thread. */
  async function fetchMessages(threadId: string): Promise<ApiMessagesResponse> {
    return $fetch('/api/messages', { query: { thread_id: threadId } });
  }

  /** Fetch tool calls for observability. */
  async function fetchToolCalls(
    workspaceId: string,
    threadId?: string,
  ): Promise<ApiToolCallsResponse> {
    return $fetch('/api/observability/tool-calls', {
      query: { workspace_id: workspaceId, ...(threadId ? { thread_id: threadId } : {}) },
    });
  }

  /** Fetch evidence (tool calls + verification) for a specific user message. */
  async function fetchEvidence(messageId: string): Promise<ApiEvidenceResponse> {
    return $fetch('/api/evidence', { query: { message_id: messageId } });
  }

  return {
    fetchWorkspaces,
    fetchSources,
    createSource,
    testSourceConnection,
    fetchThreads,
    fetchMessages,
    fetchToolCalls,
    fetchEvidence,
  };
}
