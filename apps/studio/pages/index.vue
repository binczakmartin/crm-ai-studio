<!--
@file Chat Page
@description Main chat page with SSE streaming, message list, composer, and evidence drawer.
@remarks This is the primary user interaction page. Implements smart auto-scroll and evidence display.
-->

<template>
  <div class="chat-page">
    <div class="chat-main">
      <MessageList
        :messages="displayMessages"
        :streaming-content="chat.status.value !== 'done' && chat.status.value !== 'idle' ? chat.streamedContent.value : undefined"
        :selected-message-id="selectedMessageId"
        :suggestions="suggestedQuestions"
        @toggle-evidence="toggleEvidence"
        @suggest="handleSend"
      />

      <ChatComposer
        :status="chat.status.value"
        placeholder="Ask about your CRM data..."
        @send="handleSend"
      />
    </div>

    <EvidenceDrawer
      :open="drawerOpen"
      :evidence="displayedEvidence"
      :citations="currentCitations"
      @close="drawerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * @file Chat Page Script
 * @description Chat page logic: multi-thread support, message fetching, sending, and evidence drawer.
 * @remarks Uses shared useChatHistory for thread selection. Watches activeThreadId to switch conversations.
 */

import { ref, computed, watch, onMounted } from 'vue';
import { useChatStream } from '~/composables/useChatStream';

const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

const api = useApiClient();
const chat = useChatStream();
const history = useChatHistory();

/** Suggested questions shown on empty chat. */
const suggestedQuestions = [
  'How many customers do we have by status?',
  'What is the total value of open deals in negotiation stage?',
  'Show me the top 5 customers by revenue',
  'List all upcoming activities for this week',
  'Which deals were closed won and what is the total amount?',
];

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Array<{ index: number; evidenceId: string; evidenceType: string; label?: string }>;
  createdAt?: string;
}

const messages = ref<DisplayMessage[]>([]);
const drawerOpen = ref(false);
const selectedMessageId = ref<string | null>(null);

/** Guard flag: prevents the activeThreadId watcher from resetting evidence after sending a message. */
const skipNextThreadWatch = ref(false);

const displayMessages = computed(() => {
  const msgs = [...messages.value];
  // If we have a completed answer, add it as a message
  if (chat.status.value === 'done' && chat.evidence.value.answer) {
    const answer = chat.evidence.value.answer;
    const exists = msgs.some((m) => m.content === answer.content && m.role === 'assistant');
    if (!exists) {
      msgs.push({
        id: `stream-${Date.now()}`,
        role: 'assistant',
        content: answer.content,
        citations: (answer.citations as DisplayMessage['citations']) ?? [],
      });
    }
  }
  return msgs;
});

/** Evidence state per message — caches loaded evidence to avoid re-fetching. */
const evidenceCache = ref<Map<string, typeof chat.evidence.value>>(new Map());

/** The evidence currently displayed in the drawer (for the selected message). */
const displayedEvidence = computed(() => {
  if (selectedMessageId.value && evidenceCache.value.has(selectedMessageId.value)) {
    return evidenceCache.value.get(selectedMessageId.value)!;
  }
  return chat.evidence.value;
});

/** Citations for the currently displayed evidence. */
const currentCitations = computed(() => {
  return displayedEvidence.value.answer?.citations as DisplayMessage['citations'] ?? [];
});

async function handleSend(content: string) {
  // Add user message to local list immediately
  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    citations: [],
  });

  // Send to backend with streaming
  const existingThreadId = history.activeThreadId.value ?? chat.threadId.value ?? undefined;
  await chat.sendMessage(content, DEMO_WORKSPACE_ID, existingThreadId);

  // After sending, register the thread in the sidebar history
  // Use guard flag to prevent the activeThreadId watcher from resetting evidence
  if (chat.threadId.value) {
    skipNextThreadWatch.value = true;
    history.addThread({
      id: chat.threadId.value,
      title: content.slice(0, 80),
      createdAt: new Date().toISOString(),
    });
  }

  // Reload messages from server if we have a thread
  if (chat.threadId.value) {
    await loadMessages(chat.threadId.value);

    // Cache the live streaming evidence for the latest assistant message
    const lastAssistant = [...messages.value].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant && chat.evidence.value.toolCalls.length > 0) {
      evidenceCache.value.set(lastAssistant.id, { ...chat.evidence.value });
      selectedMessageId.value = lastAssistant.id;
    }
  }
}

async function loadMessages(threadId: string) {
  try {
    const result = await api.fetchMessages(threadId);
    messages.value = result.messages
      .filter((m) => m.role !== 'system') // Hide system messages (verification reports)
      .map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        citations: (m.citations as DisplayMessage['citations']) ?? [],
        createdAt: m.createdAt,
      }));

    // Restore evidence for the last assistant message
    await loadEvidenceForLastMessage();
  } catch {
    // Non-blocking
  }
}

/**
 * Load evidence (tool calls + verification) from the DB for the last user message.
 * Caches the result per assistant message for the Evidence drawer.
 */
async function loadEvidenceForLastMessage() {
  // Find the last user message (tool_calls are linked to the user message_id)
  const lastUserMsg = [...messages.value].reverse().find((m) => m.role === 'user');
  if (!lastUserMsg) return;

  try {
    const evidenceData = await api.fetchEvidence(lastUserMsg.id);
    if (evidenceData.toolCalls.length > 0) {
      const lastAssistant = [...messages.value].reverse().find((m) => m.role === 'assistant');
      const evidence = {
        toolCalls: evidenceData.toolCalls.map((tc) => ({
          tool: tc.tool,
          args: tc.args,
          status: tc.status,
          durationMs: tc.durationMs ?? undefined,
          rowCount: tc.rowCount ?? undefined,
          error: tc.error ?? undefined,
        })),
        verification: evidenceData.verification ?? undefined,
        answer: lastAssistant
          ? { content: lastAssistant.content, citations: lastAssistant.citations }
          : undefined,
      };
      // Set as the global evidence (for latest message display)
      chat.evidence.value = evidence;
      // Also cache for per-message access
      if (lastAssistant) {
        evidenceCache.value.set(lastAssistant.id, evidence);
        selectedMessageId.value = lastAssistant.id;
      }
    }
  } catch {
    // Non-blocking — evidence drawer will just be empty
  }
}

/**
 * Toggle the evidence drawer for a specific assistant message.
 * Loads evidence from the DB for the corresponding user message if not cached.
 */
async function toggleEvidence(messageId: string) {
  if (selectedMessageId.value === messageId && drawerOpen.value) {
    drawerOpen.value = false;
    return;
  }

  selectedMessageId.value = messageId;
  drawerOpen.value = true;

  // If already cached, nothing more to do
  if (evidenceCache.value.has(messageId)) return;

  // Find the user message that precedes this assistant message
  // (tool_calls are linked to the user message_id in the DB)
  const msgIndex = messages.value.findIndex((m) => m.id === messageId);
  let userMsgId: string | null = null;
  if (msgIndex >= 0) {
    // Walk backwards from the clicked message to find the preceding user message
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages.value[i]!.role === 'user') {
        userMsgId = messages.value[i]!.id;
        break;
      }
    }
    // If the clicked message IS a user message, use it directly
    if (messages.value[msgIndex]!.role === 'user') {
      userMsgId = messageId;
    }
  }

  if (!userMsgId) return;

  try {
    const evidenceData = await api.fetchEvidence(userMsgId);
    if (evidenceData.toolCalls.length > 0) {
      // Find the assistant message right after this user message
      const assistantMsg = messages.value.find(
        (m, i) => m.role === 'assistant' && i > messages.value.findIndex((u) => u.id === userMsgId),
      );
      const evidence = {
        toolCalls: evidenceData.toolCalls.map((tc) => ({
          tool: tc.tool,
          args: tc.args,
          status: tc.status,
          durationMs: tc.durationMs ?? undefined,
          rowCount: tc.rowCount ?? undefined,
          error: tc.error ?? undefined,
        })),
        verification: evidenceData.verification ?? undefined,
        answer: assistantMsg
          ? { content: assistantMsg.content, citations: assistantMsg.citations }
          : undefined,
      };
      evidenceCache.value.set(messageId, evidence);
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Watch activeThreadId to handle switching conversations.
 * When null → new chat (clear messages). When set → load that thread's messages.
 */
watch(
  () => history.activeThreadId.value,
  async (newId) => {
    // Skip reset when the change came from the current chat registering its thread
    if (skipNextThreadWatch.value) {
      skipNextThreadWatch.value = false;
      return;
    }

    // Reset streaming state for actual thread switch
    chat.reset();
    drawerOpen.value = false;
    selectedMessageId.value = null;
    evidenceCache.value.clear();

    if (newId) {
      // Load existing thread
      chat.threadId.value = newId;
      await loadMessages(newId);
    } else {
      // New chat — clear everything
      messages.value = [];
    }
  },
);

onMounted(async () => {
  // Load thread list
  await history.loadThreads();

  // If a thread is already selected (from sidebar click), load it
  if (history.activeThreadId.value) {
    chat.threadId.value = history.activeThreadId.value;
    await loadMessages(history.activeThreadId.value);
  } else if (history.threads.value.length > 0) {
    // Auto-select the latest thread
    const latest = history.threads.value[0]!;
    history.selectThread(latest.id);
  }
});
</script>

<style scoped>
.chat-page {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
