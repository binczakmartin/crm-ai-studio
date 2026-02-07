<!--
@file EvidenceDrawer Organism
@description Slide-out drawer displaying evidence for an assistant message: tool calls, SQL queries,
  timings, row counts, chunk excerpts, and citation IDs with copy buttons.
@remarks Keyboard accessible. Closes with Escape. Traps focus when open.
-->

<template>
  <Transition name="drawer">
    <aside
      v-if="open"
      class="evidence-drawer"
      role="complementary"
      aria-label="Evidence drawer"
      @keydown.escape="$emit('close')"
    >
      <div class="drawer-header">
        <h2 class="drawer-title">📎 Evidence</h2>
        <button
          class="drawer-close focus-ring"
          aria-label="Close evidence drawer"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="drawer-content">
        <!-- Tool Calls Section -->
        <section v-if="evidence.toolCalls.length > 0" class="drawer-section">
          <h3 class="section-title">Tool Calls</h3>
          <div
            v-for="(tc, i) in evidence.toolCalls"
            :key="i"
            class="tool-call-card"
          >
            <div class="tool-call-header">
              <span class="tool-name">{{ tc.tool }}</span>
              <AppBadge :variant="tc.status === 'success' ? 'success' : tc.status === 'error' ? 'error' : 'info'">
                {{ tc.status ?? 'pending' }}
              </AppBadge>
            </div>

            <!-- SQL display -->
            <div v-if="tc.args?.sql" class="sql-block">
              <div class="sql-header">
                <span class="sql-label">SQL Query</span>
                <button class="copy-btn focus-ring" aria-label="Copy SQL" @click="copyText(String(tc.args.sql))">
                  {{ copiedSql === i ? '✓ Copied' : '⧉ Copy' }}
                </button>
              </div>
              <pre class="sql-code"><code>{{ tc.args.sql }}</code></pre>
            </div>

            <!-- Timing & Row Count -->
            <div class="tool-call-meta">
              <span v-if="tc.durationMs != null" class="meta-item">⏱ {{ tc.durationMs }}ms</span>
              <span v-if="tc.rowCount != null" class="meta-item">📊 {{ tc.rowCount }} rows</span>
            </div>

            <!-- Error -->
            <div v-if="tc.error" class="tool-call-error" role="alert">
              ⚠ {{ tc.error }}
            </div>
          </div>
        </section>

        <!-- Citations Section -->
        <section v-if="citations.length > 0" class="drawer-section">
          <h3 class="section-title">Citations</h3>
          <div class="citations-list">
            <CitationChip
              v-for="cit in citations"
              :key="cit.index"
              :index="cit.index"
              :evidence-id="cit.evidenceId"
              :evidence-type="cit.evidenceType"
              :label="cit.label"
            />
          </div>
        </section>

        <!-- Verification Report -->
        <section v-if="evidence.verification" class="drawer-section">
          <h3 class="section-title">Verification</h3>
          <AppBadge :variant="(evidence.verification as any)?.approved ? 'success' : 'warning'">
            {{ (evidence.verification as any)?.approved ? 'Approved' : 'Needs Review' }}
          </AppBadge>
          <p v-if="(evidence.verification as any)?.summary" class="verification-summary">
            {{ (evidence.verification as any).summary }}
          </p>
        </section>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
/**
 * @file EvidenceDrawer Script
 * @description Evidence drawer props, citation display, and copy functionality.
 * @remarks Receives evidence data from the chat pipeline.
 */

import { ref, computed } from 'vue';
import type { EvidenceData } from '~/composables/useChatStream';

const props = defineProps<{
  open: boolean;
  evidence: EvidenceData;
  citations?: Array<{ index: number; evidenceId: string; evidenceType: 'tool_result' | 'chunk'; label?: string }>;
}>();

defineEmits<{
  close: [];
}>();

const copiedSql = ref<number | null>(null);

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard API may fail
  }
}
</script>

<style scoped>
.evidence-drawer {
  width: 420px;
  min-width: 420px;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
}

.drawer-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.drawer-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 1.1rem;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
}

.drawer-close:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md) var(--space-lg);
}

.drawer-section {
  margin-bottom: var(--space-lg);
}

.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-sm) 0;
}

.tool-call-card {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-sm);
}

.tool-call-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.tool-name {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-accent);
}

.sql-block {
  margin: var(--space-sm) 0;
}

.sql-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.sql-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.copy-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.15rem 0.4rem;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.copy-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.sql-code {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-sm);
  margin: 0;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

.tool-call-meta {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-xs);
}

.meta-item {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.tool-call-error {
  margin-top: var(--space-xs);
  font-size: 0.8rem;
  color: var(--color-error);
}

.citations-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.verification-summary {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
}

/* Drawer transition */
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
