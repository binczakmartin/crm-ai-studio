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
      :evidence="chat.evidence.value"
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

const currentCitations = computed(() => {
  return chat.evidence.value.answer?.citations as DisplayMessage['citations'] ?? [];
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
  }
}

async function loadMessages(threadId: string) {
  try {
    const result = await api.fetchMessages(threadId);
    messages.value = result.messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      citations: (m.citations as DisplayMessage['citations']) ?? [],
      createdAt: m.createdAt,
    }));
  } catch {
    // Non-blocking
  }
}

function toggleEvidence(messageId: string) {
  if (selectedMessageId.value === messageId) {
    drawerOpen.value = !drawerOpen.value;
  } else {
    selectedMessageId.value = messageId;
    drawerOpen.value = true;
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
