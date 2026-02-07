/**
 * @file Indexer Service Entry Point
 * @description Watches for new / updated sources and indexes their schema + content into the
 *   vector store. Currently a minimal scaffold – real logic TBD.
 * @remarks This service will eventually run as a background worker with polling or event-driven
 *   ingestion, using the pgvector extension for embeddings storage.
 */

import pg from 'pg';

// ─── Configuration ─────────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://crm_user:crm_pass@localhost:5432/crm_ai_studio';
const POLL_INTERVAL_MS = Number(process.env.INDEXER_POLL_INTERVAL_MS ?? 30_000);

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('[indexer] Starting indexer service...');

  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() AS now');
    console.log(`[indexer] Connected to database at ${(result.rows[0] as { now: string }).now}`);
    client.release();
  } catch (err) {
    console.error('[indexer] Failed to connect to database:', err);
    process.exit(1);
  }

  // Polling loop placeholder
  console.log(`[indexer] Polling every ${POLL_INTERVAL_MS}ms for new sources...`);
  setInterval(async () => {
    try {
      const client = await pool.connect();
      const { rows } = await client.query(
        "SELECT id, name FROM sources WHERE status = 'active' ORDER BY updated_at DESC LIMIT 10",
      );
      if (rows.length > 0) {
        console.log(`[indexer] Found ${rows.length} active source(s) to check`);
      }
      client.release();
    } catch (err) {
      console.error('[indexer] Poll error:', err);
    }
  }, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error('[indexer] Fatal error:', err);
  process.exit(1);
});

export { main };
