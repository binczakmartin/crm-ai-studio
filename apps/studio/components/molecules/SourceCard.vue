<!--
@file SourceCard Molecule
@description Card displaying a data source with its name, type, status, and actions.
@remarks Used in the Sources list view.
-->

<template>
  <div class="source-card" role="article" :aria-label="name">
    <div class="source-card__header">
      <span class="source-card__icon" aria-hidden="true">{{ typeIcon }}</span>
      <div class="source-card__info">
        <h3 class="source-card__name">{{ name }}</h3>
        <span class="source-card__type">{{ type }}</span>
      </div>
      <AppBadge :variant="statusVariant">{{ status }}</AppBadge>
    </div>
    <div class="source-card__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file SourceCard Script
 * @description Source card props and computed status display.
 * @remarks Maps source types to icons and statuses to badge variants.
 */

import { computed } from 'vue';

const props = defineProps<{
  name: string;
  type: string;
  status: string;
}>();

const typeIcon = computed(() => {
  const icons: Record<string, string> = { postgres: '🐘', mongo: '🍃', http: '🌐', files: '📁', rag: '🔍' };
  return icons[props.type] ?? '📦';
});

const statusVariant = computed(() => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    active: 'success', pending: 'warning', error: 'error', disabled: 'neutral',
  };
  return map[props.status] ?? 'neutral';
});
</script>

<style scoped>
.source-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  transition: border-color 0.15s;
}

.source-card:hover {
  border-color: var(--color-bg-active);
}

.source-card__header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.source-card__icon {
  font-size: 1.5rem;
}

.source-card__info {
  flex: 1;
}

.source-card__name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.source-card__type {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.source-card__actions {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--space-sm);
}
</style>
