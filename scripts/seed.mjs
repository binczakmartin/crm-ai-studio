/**
 * @file Database Seed Script
 * @description Seeds the database with a demo workspace and sample source configuration.
 * @remarks Idempotent: uses ON CONFLICT to skip existing records. Reads DATABASE_URL from .env.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envContent = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env may not exist
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_SOURCE_ID = '00000000-0000-0000-0000-000000000002';

async function seed() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log('Seeding demo data...');

  // Demo workspace
  await client.query(`
    INSERT INTO workspaces (id, name, config)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING
  `, [DEMO_WORKSPACE_ID, 'Demo Workspace', JSON.stringify({ description: 'Default demo workspace for local development' })]);
  console.log('  ✓ Demo workspace created');

  // Demo Postgres source (self-referential for testing)
  await client.query(`
    INSERT INTO sources (id, workspace_id, name, type, config, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO NOTHING
  `, [
    DEMO_SOURCE_ID,
    DEMO_WORKSPACE_ID,
    'Local CRM DB',
    'postgres',
    JSON.stringify({
      host: 'localhost',
      port: 5433,
      database: 'crm_ai_studio',
      user: 'crm_user',
      password: 'crm_pass',
    }),
    'active',
  ]);
  console.log('  ✓ Demo source created');

  // Demo source permissions (read-only, SELECT-only, including CRM tables)
  await client.query(`
    INSERT INTO source_permissions (source_id, workspace_id, can_read, can_write, allowed_tables, allowed_ops, row_limit)
    VALUES ($1, $2, true, false, $3, $4, $5)
    ON CONFLICT DO NOTHING
  `, [
    DEMO_SOURCE_ID,
    DEMO_WORKSPACE_ID,
    JSON.stringify([
      'workspaces', 'sources', 'threads', 'messages',
      'crm_customers', 'crm_contacts', 'crm_deals', 'crm_products', 'crm_activities',
    ]),
    JSON.stringify(['SELECT']),
    200,
  ]);
  console.log('  ✓ Demo source permissions created (including CRM tables)');

  // Demo thread
  const DEMO_THREAD_ID = '00000000-0000-0000-0000-000000000003';
  await client.query(`
    INSERT INTO threads (id, workspace_id, title)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING
  `, [DEMO_THREAD_ID, DEMO_WORKSPACE_ID, 'Welcome Thread']);
  console.log('  ✓ Demo thread created');

  console.log('\nSeed complete.');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
