<!--
@file AppSpinner Atom
@description Loading spinner with accessible label.
@remarks Uses CSS animation. Respects prefers-reduced-motion.
-->

<template>
  <div class="spinner-container" role="status" :aria-label="label">
    <div class="spinner" aria-hidden="true"></div>
    <span v-if="showLabel" class="spinner-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * @file AppSpinner Script
 * @description Spinner props.
 * @remarks Always provide an accessible label.
 */

defineProps<{
  label?: string;
  showLabel?: boolean;
}>();
</script>

<style scoped>
.spinner-container {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
