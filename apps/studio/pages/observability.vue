<!--
@file Observability Page
@description Tool call logs, timings, and status tracking for pipeline transparency.
@remarks Shows recent tool calls with their status, timing, and errors.
-->

<template>
  <div class="observability-page">
    <header class="page-header">
      <h1 class="page-title">📊 Observability</h1>
      <p class="page-description">Monitor tool calls, timings, and pipeline health.</p>
    </header>

    <div class="observability-content">
      <div class="toolbar">
        <AppButton variant="secondary" size="sm" :loading="loading" @click="loadToolCalls">
          Refresh
        </AppButton>
      </div>

      <div v-if="toolCalls.length === 0 && !loading" class="empty-state">
        <p>No tool calls recorded yet. Send a chat message to trigger the pipeline.</p>
      </div>

      <table v-else class="tool-calls-table" aria-label="Tool call history">
        <thead>
          <tr>
            <th>Tool</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Error</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tc in toolCalls" :key="tc.id">
            <td class="cell-tool">
              <span class="tool-name-cell">{{ tc.toolName }}</span>
            </td>
            <td>
              <AppBadge :variant="statusVariant(tc.status)">{{ tc.status }}</AppBadge>
            </td>
            <td class="cell-mono">{{ tc.durationMs != null ? `${tc.durationMs}ms` : '—' }}</td>
            <td class="cell-error">{{ tc.errorMessage || '—' }}</td>
            <td class="cell-time">{{ formatTime(tc.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file Observability Page Script
 * @description Loads and displays recent tool calls for the demo workspace.
 * @remarks Auto-refreshes on mount.
 */

import { ref, onMounted } from 'vue';

const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

const api = useApiClient();

interface ToolCallItem {
  id: string;
  toolName: string;
  status: string;
  durationMs?: number;
  errorMessage?: string;
  createdAt?: string;
}

const toolCalls = ref<ToolCallItem[]>([]);
const loading = ref(false);

async function loadToolCalls() {
  loading.value = true;
  try {
    const result = await api.fetchToolCalls(DEMO_WORKSPACE_ID);
    toolCalls.value = result.toolCalls.map((tc) => ({
      id: tc.id,
      toolName: tc.toolName,
      status: tc.status,
      durationMs: tc.durationMs ?? undefined,
      errorMessage: tc.errorMessage ?? undefined,
      createdAt: tc.createdAt,
    }));
  } catch {
    // Non-blocking
  }
  loading.value = false;
}

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    success: 'success', running: 'info', pending: 'warning', error: 'error', blocked: 'error',
  };
  return map[status] ?? 'neutral';
}

function formatTime(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '—';
  }
}

onMounted(loadToolCalls);
</script>

<style scoped>
.observability-page {
  padding: var(--space-lg) var(--space-xl);
  max-width: 1100px;
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 var(--space-xs) 0;
}

.page-description {
  color: var(--color-text-secondary);
  margin: 0;
}

.toolbar {
  margin-bottom: var(--space-md);
}

.empty-state {
  background: var(--color-bg-secondary);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  text-align: center;
  color: var(--color-text-muted);
}

.tool-calls-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.tool-calls-table th {
  text-align: left;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 2px solid var(--color-border);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tool-calls-table td {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.tool-calls-table tr:hover td {
  background: var(--color-bg-hover);
}

.tool-name-cell {
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--color-accent);
}

.cell-mono {
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.cell-error {
  color: var(--color-error);
  font-size: 0.8rem;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-time {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
