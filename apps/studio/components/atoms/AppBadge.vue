<!--
@file AppBadge Atom
@description Status badge component for displaying tool call statuses, source statuses, etc.
@remarks Color-coded by variant. Compact design.
-->

<template>
  <span :class="['app-badge', `app-badge--${variant}`]" role="status">
    <slot />
  </span>
</template>

<script setup lang="ts">
/**
 * @file AppBadge Script
 * @description Badge variant prop.
 * @remarks Variants map to semantic colors.
 */

defineProps<{
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}>();
</script>

<style scoped>
.app-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.app-badge--success { background: #22c55e22; color: var(--color-success); }
.app-badge--warning { background: #f59e0b22; color: var(--color-warning); }
.app-badge--error   { background: #ef444422; color: var(--color-error); }
.app-badge--info    { background: #3b82f622; color: var(--color-info); }
.app-badge--neutral { background: var(--color-bg-hover); color: var(--color-text-secondary); }
</style>
