<!--
@file ChatComposer Organism
@description The chat input area with send button and status indicator.
@remarks Handles Enter to send, Shift+Enter for newline. Shows pipeline status.
-->

<template>
  <div class="chat-composer">
    <div v-if="status !== 'idle' && status !== 'done' && status !== 'error'" class="composer-status">
      <AppSpinner :label="statusLabel" show-label />
    </div>

    <div class="composer-input-row">
      <textarea
        ref="inputEl"
        v-model="input"
        class="composer-textarea focus-ring"
        :placeholder="placeholder"
        :disabled="isProcessing"
        rows="1"
        aria-label="Message input"
        @keydown.enter.exact.prevent="handleSend"
        @input="autoResize"
      ></textarea>
      <AppButton
        variant="primary"
        size="md"
        :disabled="!canSend"
        :loading="isProcessing"
        aria-label="Send message"
        @click="handleSend"
      >
        Send
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file ChatComposer Script
 * @description Chat input logic with auto-resize and send handling.
 * @remarks Emits 'send' with the message content.
 */

import { ref, computed } from 'vue';
import type { ChatStatus } from '~/composables/useChatStream';

const props = defineProps<{
  status: ChatStatus;
  placeholder?: string;
}>();

const emit = defineEmits<{
  send: [content: string];
}>();

const input = ref('');
const inputEl = ref<HTMLTextAreaElement | null>(null);

const isProcessing = computed(() =>
  ['typing', 'planning', 'toolsRunning', 'verifying', 'answering'].includes(props.status),
);

const canSend = computed(() => input.value.trim().length > 0 && !isProcessing.value);

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    typing: 'Sending...',
    planning: 'Planning...',
    toolsRunning: 'Running tools...',
    verifying: 'Verifying evidence...',
    answering: 'Generating answer...',
  };
  return labels[props.status] ?? 'Processing...';
});

function handleSend() {
  if (!canSend.value) return;
  emit('send', input.value.trim());
  input.value = '';
  if (inputEl.value) {
    inputEl.value.style.height = 'auto';
  }
}

function autoResize() {
  if (inputEl.value) {
    inputEl.value.style.height = 'auto';
    inputEl.value.style.height = Math.min(inputEl.value.scrollHeight, 200) + 'px';
  }
}
</script>

<style scoped>
.chat-composer {
  border-top: 1px solid var(--color-border);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-secondary);
}

.composer-status {
  margin-bottom: var(--space-sm);
}

.composer-input-row {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-end;
}

.composer-textarea {
  flex: 1;
  resize: none;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  line-height: 1.5;
  min-height: 40px;
  max-height: 200px;
  overflow-y: auto;
}

.composer-textarea:focus {
  border-color: var(--color-border-focus);
}

.composer-textarea::placeholder {
  color: var(--color-text-muted);
}

.composer-textarea:disabled {
  opacity: 0.6;
}
</style>
