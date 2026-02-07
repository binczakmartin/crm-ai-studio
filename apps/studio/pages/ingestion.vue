<!--
@file Ingestion Page
@description Ingestion management page — minimal UI for MVP. Shows placeholder for file/folder ingestion.
@remarks Full implementation pending indexer service wiring.
-->

<template>
  <div class="ingestion-page">
    <header class="page-header">
      <h1 class="page-title">📥 Ingestion</h1>
      <p class="page-description">Ingest local folders and files into the vector store for RAG-based answers.</p>
    </header>

    <div class="ingestion-content">
      <div class="ingestion-placeholder">
        <span class="placeholder-icon" aria-hidden="true">🚧</span>
        <h2 class="placeholder-title">Coming Soon</h2>
        <p class="placeholder-text">
          File and folder ingestion will be available once the indexer service is fully wired.
          The infrastructure is in place: documents, chunks, and vectors tables are ready.
        </p>
        <div class="placeholder-status">
          <AppBadge variant="info">Scaffolded</AppBadge>
          <span class="status-text">Indexer service and embeddings pipeline are defined</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file Ingestion Page Script
 * @description Minimal ingestion page for MVP.
 * @remarks Extend with file upload and ingestion status when indexer is ready.
 */
</script>

<style scoped>
.ingestion-page {
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

.ingestion-placeholder {
  background: var(--color-bg-secondary);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  text-align: center;
}

.placeholder-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--space-md);
}

.placeholder-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 var(--space-sm) 0;
}

.placeholder-text {
  color: var(--color-text-secondary);
  max-width: 500px;
  margin: 0 auto var(--space-md);
  line-height: 1.6;
}

.placeholder-status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.status-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
