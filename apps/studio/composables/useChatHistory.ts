/**
 * @file Chat History Composable
 * @description Global state for thread history and active thread selection.
 * @remarks Shared between sidebar (thread list) and chat page (messages). Uses useState for SSR-safe global state.
 */

import type { Thread } from '@crm-ai/shared';

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Composable managing thread history + active thread selection.
 * Uses Nuxt useState so state is shared across components.
 * MAX_CHAT_HISTORY is read from the server runtime config (env var MAX_CHAT_HISTORY).
 */
export function useChatHistory() {
  const threads = useState<ChatThread[]>('chat-threads', () => []);
  const activeThreadId = useState<string | null>('active-thread-id', () => null);
  const loading = useState<boolean>('chat-history-loading', () => false);
  const maxHistory = useState<number>('max-chat-history', () => 20);

  const api = useApiClient();

  /** Load threads from the server. Also fetches the max history config. */
  async function loadThreads() {
    loading.value = true;
    try {
      // Fetch max chat history from server config
      try {
        const configData = await $fetch<{ maxChatHistory: number }>('/api/config');
        if (configData?.maxChatHistory) {
          maxHistory.value = configData.maxChatHistory;
        }
      } catch {
        // Use default
      }
      const result = await api.fetchThreads(DEMO_WORKSPACE_ID);
      threads.value = result.threads.slice(0, maxHistory.value).map((t) => ({
        id: t.id,
        title: t.title || 'New chat',
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    } catch {
      // Non-blocking — keep current state
    } finally {
      loading.value = false;
    }
  }

  /** Select an existing thread as active. */
  function selectThread(threadId: string) {
    activeThreadId.value = threadId;
  }

  /** Start a new chat — clears active thread. */
  function newChat() {
    activeThreadId.value = null;
  }

  /** Add a thread to the top of the list (when a new one is created via chat). */
  function addThread(thread: ChatThread) {
    // Remove duplicate if it exists
    threads.value = threads.value.filter((t) => t.id !== thread.id);
    // Add to the top
    threads.value.unshift(thread);
    // Trim to maxHistory
    if (threads.value.length > maxHistory.value) {
      threads.value = threads.value.slice(0, maxHistory.value);
    }
    activeThreadId.value = thread.id;
  }

  /** Update a thread title in the list (e.g. after first message sets title). */
  function updateThreadTitle(threadId: string, title: string) {
    const thread = threads.value.find((t) => t.id === threadId);
    if (thread) {
      thread.title = title;
    }
  }

  return {
    threads,
    activeThreadId,
    loading,
    loadThreads,
    selectThread,
    newChat,
    addThread,
    updateThreadTitle,
  };
}
