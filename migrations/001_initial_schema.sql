-- @file 001_initial_schema
-- @description Creates all core tables for CRM AI Studio: workspaces, sources, permissions, threads, messages, tool_calls, tool_results, documents, chunks, and vectors.
-- @remarks Rollback: DROP all tables in reverse order. pgvector extension must be available on the Postgres instance.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Workspaces
-- ============================================================================
CREATE TABLE workspaces (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Sources
-- ============================================================================
CREATE TABLE sources (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('postgres', 'mongo', 'http', 'files', 'rag')),
  config        JSONB NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disabled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sources_workspace ON sources(workspace_id);

-- ============================================================================
-- Source Permissions
-- ============================================================================
CREATE TABLE source_permissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id       UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  can_read        BOOLEAN NOT NULL DEFAULT true,
  can_write       BOOLEAN NOT NULL DEFAULT false,
  allowed_tables  JSONB NOT NULL DEFAULT '[]',
  allowed_ops     JSONB NOT NULL DEFAULT '["SELECT"]',
  row_limit       INTEGER NOT NULL DEFAULT 200,
  rate_limit_rpm  INTEGER NOT NULL DEFAULT 60,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_source_permissions_source ON source_permissions(source_id);
CREATE INDEX idx_source_permissions_workspace ON source_permissions(workspace_id);

-- ============================================================================
-- Threads
-- ============================================================================
CREATE TABLE threads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_threads_workspace ON threads(workspace_id, created_at DESC);

-- ============================================================================
-- Messages
-- ============================================================================
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id     UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content       TEXT NOT NULL,
  citations     JSONB NOT NULL DEFAULT '[]',
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_thread ON messages(thread_id, created_at ASC);
CREATE INDEX idx_messages_workspace ON messages(workspace_id);

-- ============================================================================
-- Tool Calls
-- ============================================================================
CREATE TABLE tool_calls (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id    UUID REFERENCES messages(id) ON DELETE SET NULL,
  thread_id     UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tool_name     TEXT NOT NULL,
  tool_args     JSONB NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error', 'blocked')),
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ,
  duration_ms   INTEGER,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_calls_thread ON tool_calls(thread_id, created_at DESC);
CREATE INDEX idx_tool_calls_workspace ON tool_calls(workspace_id);

-- ============================================================================
-- Tool Results
-- ============================================================================
CREATE TABLE tool_results (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_call_id  UUID NOT NULL REFERENCES tool_calls(id) ON DELETE CASCADE,
  thread_id     UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  data          JSONB NOT NULL DEFAULT '{}',
  row_count     INTEGER,
  checksum      TEXT,
  preview_rows  JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_results_tool_call ON tool_results(tool_call_id);
CREATE INDEX idx_tool_results_thread ON tool_results(thread_id);

-- ============================================================================
-- Documents (for file/RAG ingestion)
-- ============================================================================
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_id     UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  path          TEXT NOT NULL,
  mime_type     TEXT,
  content_hash  TEXT NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'indexed', 'error')),
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, source_id, path)
);

CREATE INDEX idx_documents_workspace_source ON documents(workspace_id, source_id);

-- ============================================================================
-- Chunks
-- ============================================================================
CREATE TABLE chunks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  chunk_index   INTEGER NOT NULL,
  content       TEXT NOT NULL,
  token_count   INTEGER,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chunks_document ON chunks(document_id, chunk_index ASC);
CREATE INDEX idx_chunks_workspace ON chunks(workspace_id);

-- ============================================================================
-- Vectors (pgvector embeddings linked to chunks)
-- ============================================================================
CREATE TABLE vectors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chunk_id      UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  embedding     vector(768),
  model_name    TEXT NOT NULL,
  model_version TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vectors_chunk ON vectors(chunk_id);
CREATE INDEX idx_vectors_workspace ON vectors(workspace_id);

-- HNSW index for cosine similarity search on vectors
CREATE INDEX idx_vectors_embedding_hnsw ON vectors
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
