<!--
@file Sources Page
@description Sources management page: list existing sources and add new ones.
@remarks Provides CRUD for Postgres sources with test connection. Read-only defaults.
-->

<template>
  <div class="sources-page">
    <header class="page-header">
      <h1 class="page-title">🔌 Data Sources</h1>
      <p class="page-description">Connect databases to enable SQL queries in your chat conversations.</p>
    </header>

    <div class="sources-content">
      <!-- Source List -->
      <section class="sources-list">
        <h2 class="section-title">Connected Sources</h2>
        <div v-if="sources.length === 0" class="sources-empty">
          <p>No sources configured yet. Add one below.</p>
        </div>
        <div v-else class="sources-grid">
          <SourceCard
            v-for="source in sources"
            :key="source.id"
            :name="source.name"
            :type="source.type"
            :status="source.status"
          />
        </div>
      </section>

      <!-- Add Source Form -->
      <section class="sources-add">
        <SourcesForm
          :workspace-id="DEMO_WORKSPACE_ID"
          @created="handleSourceCreated"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file Sources Page Script
 * @description Loads and displays sources for the demo workspace.
 * @remarks Refreshes source list after creation.
 */

import { ref, onMounted } from 'vue';

const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

const api = useApiClient();

interface SourceItem {
  id: string;
  name: string;
  type: string;
  status: string;
}

const sources = ref<SourceItem[]>([]);

async function loadSources() {
  try {
    const result = await api.fetchSources(DEMO_WORKSPACE_ID);
    sources.value = result.sources.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      status: s.status,
    }));
  } catch {
    // Non-blocking
  }
}

function handleSourceCreated() {
  loadSources();
}

onMounted(loadSources);
</script>

<style scoped>
.sources-page {
  padding: var(--space-lg) var(--space-xl);
  max-width: 900px;
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

.sources-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 var(--space-md) 0;
}

.sources-empty {
  background: var(--color-bg-secondary);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  text-align: center;
  color: var(--color-text-muted);
}

.sources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}
</style>
