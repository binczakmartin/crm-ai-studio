<!--
@file MessageBubble Molecule
@description Renders a single chat message (user or assistant). Shows role indicator,
  content with inline data tables, and an evidence button for assistant messages.
@remarks Parses data-table markers in content and renders DataTable components inline.
-->

<template>
  <div :class="['message-bubble', `message-bubble--${role}`]" role="article" :aria-label="`${role} message`">
    <div class="message-header">
      <span class="message-role">{{ role === 'user' ? 'You' : 'Assistant' }}</span>
      <span v-if="createdAt" class="message-time">{{ formatTime(createdAt) }}</span>
    </div>

    <div class="message-content">
      <template v-for="(segment, idx) in contentSegments" :key="idx">
        <DataTable
          v-if="segment.type === 'table'"
          :columns="segment.columns!"
          :rows="segment.rows!"
        />
        <span v-else v-html="segment.html"></span>
      </template>
    </div>

    <div v-if="role === 'assistant' && citations.length > 0" class="message-citations">
      <button
        class="evidence-toggle focus-ring"
        :aria-expanded="evidenceOpen"
        aria-label="Toggle evidence drawer"
        @click="$emit('toggleEvidence')"
      >
        📎 {{ citations.length }} citation{{ citations.length !== 1 ? 's' : '' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file MessageBubble Script
 * @description Message display with role differentiation, inline data tables, and citation indicators.
 * @remarks Parses <!-- data-table:{...} --> markers from the answer content and renders them
 *   as DataTable components. Falls back to formatted HTML for non-table segments.
 */

import { computed } from 'vue';

/** A parsed content segment: either formatted HTML text or a data table. */
interface ContentSegment {
  type: 'text' | 'table';
  html?: string;
  columns?: string[];
  rows?: Record<string, unknown>[];
}

const props = defineProps<{
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Array<{ index: number; evidenceId: string; evidenceType: string; label?: string }>;
  createdAt?: string;
  evidenceOpen?: boolean;
}>();

defineEmits<{
  toggleEvidence: [];
}>();

/**
 * Parse the content string into segments of text and data tables.
 * Detects <!-- data-table:{JSON} --> markers inserted by the answer generator.
 */
const contentSegments = computed<ContentSegment[]>(() => {
  const text = props.content;
  const segments: ContentSegment[] = [];
  const pattern = /<!-- data-table:(.*?) -->/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Text before the table marker
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      if (before.trim()) {
        segments.push({ type: 'text', html: formatContent(before) });
      }
    }

    // Parse the table JSON
    try {
      const tableData = JSON.parse(match[1]!) as { columns: string[]; rows: Record<string, unknown>[] };
      segments.push({ type: 'table', columns: tableData.columns, rows: tableData.rows });
    } catch {
      // If JSON parse fails, render as text
      segments.push({ type: 'text', html: formatContent(match[0]!) });
    }

    lastIndex = match.index + match[0]!.length;
  }

  // Remaining text after last marker
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining.trim()) {
      segments.push({ type: 'text', html: formatContent(remaining) });
    }
  }

  // If no segments were created, return the whole content as text
  if (segments.length === 0) {
    segments.push({ type: 'text', html: formatContent(text) });
  }

  return segments;
});

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Format text content as HTML with basic markdown-like styling. */
function formatContent(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([\d]+)\]/g, '<span class="citation-ref" title="Citation $1">[$1]</span>')
    .replace(/\n/g, '<br>');
}
</script>

<style scoped>
.message-bubble {
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  max-width: 85%;
}

.message-bubble--user {
  background: var(--color-accent-soft);
  margin-left: auto;
  border-bottom-right-radius: var(--radius-sm);
}

.message-bubble--assistant {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: var(--radius-sm);
}

.message-bubble--system {
  background: var(--color-bg-tertiary);
  font-style: italic;
  text-align: center;
  max-width: 100%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.message-role {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.message-time {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.message-content {
  font-size: 0.9rem;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-content :deep(.citation-ref) {
  color: var(--color-accent);
  font-weight: 600;
  cursor: pointer;
}

.message-citations {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border);
}

.evidence-toggle {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
  color: var(--color-accent);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
}

.evidence-toggle:hover {
  background: var(--color-accent-soft);
}
</style>
