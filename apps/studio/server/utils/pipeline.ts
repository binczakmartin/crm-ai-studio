/**
 * @file Pipeline Factory
 * @description Creates and configures the orchestrator pipeline with connectors based on runtime config.
 * @remarks Uses MockLlmAdapter by default. Replace with real Ollama adapter when available.
 */

import { Pipeline } from '@crm-ai/orchestrator';
import { PostgresConnector, MockLlmAdapter, RagConnectorStub } from '@crm-ai/connectors';
import type { useRuntimeConfig } from '#imports';

type RuntimeConfig = ReturnType<typeof useRuntimeConfig>;

/**
 * Create a configured pipeline instance.
 *
 * @param config - Nuxt runtime config.
 * @param sourceConnectionString - Connection string for the user's data source (if different from app DB).
 * @returns A configured Pipeline instance.
 */
export function createPipeline(config: RuntimeConfig, sourceConnectionString?: string) {
  const llm = new MockLlmAdapter();
  const sql = new PostgresConnector({
    connectionString: sourceConnectionString ?? config.databaseUrl,
  });
  const rag = new RagConnectorStub();

  return new Pipeline({
    llm,
    sql,
    rag,
    maxRows: config.maxSqlRows,
    toolTimeoutMs: config.toolTimeoutMs,
    plannerTemperature: config.plannerTemperature,
  });
}
