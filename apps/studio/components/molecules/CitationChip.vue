<!--
@file CitationChip Molecule
@description Compact chip displaying a citation ID with copy button.
@remarks Used inside the Evidence Drawer.
-->

<template>
  <span class="citation-chip" :title="`${evidenceType}: ${evidenceId}`">
    <span class="chip-index">[{{ index }}]</span>
    <span class="chip-label">{{ label || evidenceId.slice(0, 8) }}</span>
    <button
      class="chip-copy focus-ring"
      aria-label="Copy citation ID"
      @click.stop="copyId"
    >
      {{ copied ? '✓' : '⧉' }}
    </button>
  </span>
</template>

<script setup lang="ts">
/**
 * @file CitationChip Script
 * @description Citation display with copy-to-clipboard functionality.
 * @remarks Uses Clipboard API.
 */

import { ref } from 'vue';

const props = defineProps<{
  index: number;
  evidenceId: string;
  evidenceType: 'tool_result' | 'chunk';
  label?: string;
}>();

const copied = ref(false);

async function copyId() {
  try {
    await navigator.clipboard.writeText(props.evidenceId);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // Clipboard API may not be available
  }
}
</script>

<style scoped>
.citation-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0.2rem 0.5rem;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  color: var(--color-accent-hover);
}

.chip-index {
  font-weight: 700;
}

.chip-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
}

.chip-copy {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  padding: 0 2px;
  font-size: 0.8rem;
  line-height: 1;
}

.chip-copy:hover {
  color: var(--color-accent-hover);
}
</style>
