/**
 * @file Connectors Package Entry Point
 * @description Exports SQL and RAG connector implementations for the CRM AI Studio pipeline.
 * @remarks Connectors follow the ports/adapters pattern. Local adapters for MVP.
 */

export { PostgresConnector } from './sql/postgres-connector.js';
export { RagConnectorStub } from './rag/rag-connector-stub.js';
export { MockLlmAdapter } from './llm/mock-llm-adapter.js';
