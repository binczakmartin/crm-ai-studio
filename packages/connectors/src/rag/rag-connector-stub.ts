/**
 * @file RAG Connector Stub
 * @description Stub implementation of the RagConnector interface. Returns empty results until the
 *   indexer is fully wired. Still returns a structured ToolResult for pipeline consistency.
 * @remarks Replace this stub with a real pgvector search implementation when the indexer is ready.
 */

import type { RagConnector, RagSearchParams, RagSearchResult } from '@crm-ai/shared';

/**
 * Stub RAG connector that returns empty results.
 * Ensures the pipeline can run end-to-end even without indexed documents.
 */
export class RagConnectorStub implements RagConnector {
  /**
   * Search for relevant chunks (stub: returns empty results).
   *
   * @param _params - Search parameters (unused in stub).
   * @returns Empty search results with correct structure.
   */
  async search(_params: RagSearchParams): Promise<RagSearchResult> {
    return { chunks: [] };
  }
}
