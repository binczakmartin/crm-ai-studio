<!--
@file AppInput Atom
@description Reusable text input component with label, error state, and accessibility.
@remarks Always use with a label for a11y. Supports v-model.
-->

<template>
  <div class="app-input-wrapper">
    <label v-if="label" :for="inputId" class="app-input-label">{{ label }}</label>
    <input
      :id="inputId"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${inputId}-error` : undefined"
      class="app-input focus-ring"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" :id="`${inputId}-error`" class="app-input-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * @file AppInput Script
 * @description Input props and model binding.
 * @remarks Generates unique IDs for label-input association.
 */

import { computed } from 'vue';

const props = defineProps<{
  modelValue?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();

const inputId = computed(() => `input-${props.label?.replace(/\s+/g, '-').toLowerCase() ?? Math.random().toString(36).slice(2)}`);
</script>

<style scoped>
.app-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.app-input-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.app-input {
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  transition: border-color 0.15s;
}

.app-input:hover:not(:disabled) {
  border-color: var(--color-bg-active);
}

.app-input:focus {
  border-color: var(--color-border-focus);
}

.app-input::placeholder {
  color: var(--color-text-muted);
}

.app-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-input[aria-invalid="true"] {
  border-color: var(--color-error);
}

.app-input-error {
  font-size: 0.75rem;
  color: var(--color-error);
  margin: 0;
}
</style>
