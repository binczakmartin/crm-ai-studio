<!--
@file DataTable Atom
@description Lightweight, condensed data table for displaying query results inline in chat messages.
@remarks Renders a compact table with sticky headers, zebra rows, and responsive horizontal scroll.
  Designed for dark-mode CRM Studio UI with design tokens.
-->

<template>
  <div class="data-table-wrapper" role="region" aria-label="Query result table" tabindex="0">
    <table class="data-table" aria-describedby="data-table-caption">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col" class="data-table__th">
            {{ formatHeader(col) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in rows" :key="idx" class="data-table__tr">
          <td v-for="col in columns" :key="col" class="data-table__td">
            {{ formatCell(row[col]) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
/**
 * @file DataTable Script
 * @description Props and formatting helpers for the compact data table.
 * @remarks Values are auto-formatted: numbers get locale formatting, nulls become '—'.
 */

const props = defineProps<{
  /** Column names from the query result. */
  columns: string[];
  /** Array of row objects keyed by column name. */
  rows: Record<string, unknown>[];
}>();

/**
 * Format a column header for display: replace underscores with spaces and capitalize.
 */
function formatHeader(col: string): string {
  return col
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a cell value for display.
 * Numbers get locale formatting, nulls show '—', dates are simplified.
 */
function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    // Format large numbers with separators, keep decimals for currency-like values
    return value % 1 !== 0
      ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value.toLocaleString('en-US');
  }
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  // ISO date detection
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    try {
      return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return str;
    }
  }
  return str;
}
</script>

<style scoped>
.data-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin: var(--space-sm) 0;
  max-width: 100%;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  line-height: 1.4;
  white-space: nowrap;
}

.data-table__th {
  position: sticky;
  top: 0;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: var(--space-xs) var(--space-sm);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.data-table__tr:nth-child(even) {
  background: var(--color-bg-tertiary);
}

.data-table__tr:hover {
  background: var(--color-bg-hover);
}

.data-table__td {
  padding: var(--space-xs) var(--space-sm);
  color: var(--color-text-primary);
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 40%, transparent);
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
