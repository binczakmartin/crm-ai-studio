<!--
@file AppButton Atom
@description Reusable button component with variants, sizes, and loading state.
@remarks Supports keyboard navigation. Accessible with ARIA attributes.
-->

<template>
  <button
    :class="['app-btn', `app-btn--${variant}`, `app-btn--${size}`, { 'app-btn--loading': loading }]"
    :disabled="disabled || loading"
    :aria-busy="loading"
    class="focus-ring"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="app-btn__spinner" aria-hidden="true">⟳</span>
    <slot />
  </button>
</template>

<script setup lang="ts">
/**
 * @file AppButton Script
 * @description Button props and emits.
 * @remarks Variants: primary, secondary, ghost, danger. Sizes: sm, md, lg.
 */

defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}>();

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
  white-space: nowrap;
}

.app-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.app-btn--sm { padding: 0.375rem 0.75rem; font-size: 0.8rem; }
.app-btn--md { padding: 0.5rem 1rem; font-size: 0.875rem; }
.app-btn--lg { padding: 0.625rem 1.25rem; font-size: 1rem; }

/* Variants */
.app-btn--primary {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}
.app-btn--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.app-btn--secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}
.app-btn--secondary:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.app-btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}
.app-btn--ghost:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.app-btn--danger {
  background: var(--color-error);
  color: white;
  border-color: var(--color-error);
}

/* Loading */
.app-btn--loading { pointer-events: none; }
.app-btn__spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
