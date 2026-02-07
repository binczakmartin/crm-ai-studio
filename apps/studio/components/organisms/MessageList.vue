<!--
@file MessageList Organism
@description Scrollable list of chat messages with smart auto-scroll behavior.
@remarks Auto-scrolls to bottom when new messages arrive, but only if user is already at the bottom.
-->

<template>
  <div ref="listEl" class="message-list" role="log" aria-live="polite" @scroll="handleScroll">
    <div v-if="messages.length === 0 && !streamingContent" class="message-list__empty">
      <p class="empty-title">👋 Welcome to CRM AI Studio</p>
      <p class="empty-subtitle">Ask a question about your CRM data. The assistant will query your sources and provide evidence-backed answers.</p>

      <div v-if="suggestions.length > 0" class="suggestions">
        <p class="suggestions-label">Try one of these:</p>
        <button
          v-for="(q, i) in suggestions"
          :key="i"
          class="suggestion-chip focus-ring"
          @click="$emit('suggest', q)"
        >
          {{ q }}
        </button>
      </div>
    </div>

    <div v-for="msg in messages" :key="msg.id" class="message-list__item">
      <MessageBubble
        :role="msg.role"
        :content="msg.content"
        :citations="msg.citations"
        :created-at="msg.createdAt"
        :evidence-open="selectedMessageId === msg.id"
        @toggle-evidence="$emit('toggleEvidence', msg.id)"
      />
    </div>

    <!-- Streaming message (in progress) -->
    <div v-if="streamingContent" class="message-list__item">
      <MessageBubble
        role="assistant"
        :content="streamingContent"
        :citations="[]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file MessageList Script
 * @description Message list with auto-scroll logic.
 * @remarks Watches for content changes and scrolls if user is near the bottom.
 */

import { ref, watch, nextTick, onMounted } from 'vue';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Array<{ index: number; evidenceId: string; evidenceType: string; label?: string }>;
  createdAt?: string;
}

const props = defineProps<{
  messages: MessageItem[];
  streamingContent?: string;
  selectedMessageId?: string | null;
  suggestions?: string[];
}>();

defineEmits<{
  toggleEvidence: [messageId: string];
  suggest: [question: string];
}>();

const listEl = ref<HTMLElement | null>(null);
const isAtBottom = ref(true);

function handleScroll() {
  if (!listEl.value) return;
  const { scrollTop, scrollHeight, clientHeight } = listEl.value;
  isAtBottom.value = scrollHeight - scrollTop - clientHeight < 50;
}

function scrollToBottom() {
  if (listEl.value && isAtBottom.value) {
    nextTick(() => {
      listEl.value!.scrollTop = listEl.value!.scrollHeight;
    });
  }
}

// Auto-scroll on new messages or streaming content
watch(() => props.messages.length, scrollToBottom);
watch(() => props.streamingContent, scrollToBottom);

onMounted(scrollToBottom);
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.message-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  padding: var(--space-2xl);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--space-sm);
}

.empty-subtitle {
  color: var(--color-text-secondary);
  max-width: 450px;
  line-height: 1.6;
}

.suggestions {
  margin-top: var(--space-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  max-width: 520px;
}

.suggestions-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-xs);
}

.suggestion-chip {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.suggestion-chip:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-accent);
}

.message-list__item {
  display: flex;
  flex-direction: column;
}
</style>
