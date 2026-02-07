<!-- README.md -->

# Local CRM AI Studio — Local-First “Chat With Your CRM Data” (Evidence-Grounded)

**Local CRM AI Studio** is a local-first framework + studio UI that turns natural language into **verified tool executions** (SQL / files / RAG / APIs) and produces answers **only** from evidence, with citations.

> **MVP status:** Runs 100% locally (Docker).  
> **Cloud-ready:** Designed with ports/adapters so AWS deployment can be added later without rewriting core logic.

---

## Why this project exists
LLMs are probabilistic. “Perfect accuracy” does not come from prompting alone—it comes from architecture.

Local CRM AI Studio enforces:
- **Evidence or silence:** no facts/numbers without tool results
- **Deterministic math:** aggregates and calculations are executed by SQL or deterministic code
- **Structured outputs:** planning and answers are validated against schemas
- **Safe-by-default access:** SQL is SELECT-only with hard limits and allowlists

---

## Key Features (MVP)
### Studio UI (Nuxt)
- ChatGPT-like chat with **SSE streaming**
- **Evidence Drawer** per message:
  - tool calls
  - SQL queries and row counts
  - RAG chunks with `chunk_id`
  - citation IDs for every claim
- Sources management:
  - add/test Postgres sources
  - set permissions (read-only by default)
- Ingestion:
  - ingest a local folder into pgvector
  - view indexing status and errors
- Observability:
  - tool call logs, timings, trace IDs, failures

### Orchestrator (core engine)
- Strict pipeline: **Plan (JSON) → Tools → Verify → Answer**
- Policy engine:
  - schema validation
  - tool gating
  - SQL AST-based safety enforcement
- Verifier:
  - rejects unsupported claims
  - ensures every numeric/factual claim has citations

---

## Architecture Overview

### Pipeline (high level)
```
User Message
  ↓
Planner (LLM) → Plan JSON (validated)
  ↓
Policy Engine → allowlists, limits, safety checks
  ↓
Tool Runtime → executes real tools (SQL/RAG/files/http) + persists results
  ↓
Verifier → enforces evidence requirements
  ↓
Final Answer (LLM) → grounded response + citations
```

### Evidence Model
Every assistant answer must cite:
- `tool_result_id` for structured tool outputs (SQL/API/tools)
- `chunk_id` for RAG excerpt evidence

If evidence is missing or insufficient, the assistant must respond:
- “I can’t conclude from the available data” and request the missing info, **or**
- propose a safe follow-up plan to retrieve evidence.

---

## Repository Structure
> Keep this section updated whenever files move.

- `apps/studio/` — Nuxt Studio UI
- `packages/shared/` — shared types + runtime schemas + errors
- `packages/orchestrator/` — pipeline engine
- `packages/connectors/` — SQL/RAG/files/http connectors
- `packages/policies/` — safety and permission enforcement
- `services/indexer/` — ingestion + embeddings + vector upserts
- `infra/local/` — docker-compose + init scripts
- `migrations/` — DB migrations
- `docs/` — architecture notes and decisions

---

## Quickstart (Local MVP)

### Prerequisites
- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 9.15
- **Docker** + Docker Compose

### 1) Install dependencies
```bash
pnpm install
```

### 2) Start local infrastructure
```bash
docker compose -f infra/local/docker-compose.yml up -d
```

This starts:
- **PostgreSQL 17 + pgvector** on port `5432` (user: `crm_user`, pass: `crm_pass`, db: `crm_ai_studio`)
- **Ollama** on port `11434` (optional — the app falls back to `MockLlmAdapter` if Ollama is unavailable)

### 3) Configure environment
```bash
cp .env.example .env
```

Key variables (all have sensible defaults):
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://crm_user:crm_pass@localhost:5432/crm_ai_studio` | Postgres connection |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama endpoint |
| `CHAT_MODEL` | `llama3.2` | Chat / planner model |
| `EMBEDDINGS_MODEL` | `nomic-embed-text` | Embeddings model |
| `MAX_SQL_ROWS` | `200` | Global row limit |
| `NUXT_PORT` | `3000` | Studio UI port |

### 4) Run migrations (and optional seed)
```bash
pnpm db:migrate
pnpm db:seed   # creates demo workspace, source, and thread
```

### 5) Start development servers
```bash
pnpm dev
```

### 6) Open the Studio
- **Studio UI:** [http://localhost:3000](http://localhost:3000)

---

## Configuration

### Environment Variables
> Keep this list in sync with `.env.example`.

- `DATABASE_URL` — Postgres connection string (`postgresql://crm_user:crm_pass@localhost:5432/crm_ai_studio`)
- `OLLAMA_BASE_URL` — local LLM runtime URL (`http://localhost:11434`)
- `EMBEDDINGS_MODEL` — embeddings model for ingestion (`nomic-embed-text`)
- `CHAT_MODEL` — chat/planner model (`llama3.2`)
- `MAX_SQL_ROWS` — global row limit enforced server-side (`200`)
- `RAG_TOP_K` — default number of chunks to retrieve (`8`)
- `PLANNER_TEMPERATURE` — LLM temperature for planning (`0.1`)
- `TOOL_TIMEOUT_MS` — per-tool execution timeout (`30000`)
- `NUXT_PORT` — Studio UI port (`3000`)

---

## Data Sources & Permissions (MVP)

### Postgres SQL Source (read-only by default)
- Allowed operations: `SELECT` only
- Enforced constraints:
  - single statement
  - LIMIT forced server-side
  - allowlist tables/columns
- Any request for writes (UPDATE/DELETE) is out of scope for MVP unless “danger mode” is introduced later.

### Files + RAG
- Folder ingestion:
  - documents are hashed for idempotence
  - chunking is deterministic
  - embeddings stored in pgvector
- Retrieval:
  - top-k conservative by default (6–12)
  - returns chunk excerpts + IDs for citations

---

## API Overview (Studio ↔ Orchestrator)
> Keep this section updated when routes change.

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/chat/stream` | SSE streaming chat endpoint |
| `GET` | `/api/sources` | List sources by `workspace_id` |
| `POST` | `/api/sources` | Create a new Postgres source |
| `POST` | `/api/sources/test` | Test a Postgres connection |
| `GET` | `/api/threads` | List threads by `workspace_id` |
| `GET` | `/api/messages` | List messages by `thread_id` |
| `GET` | `/api/workspaces` | List all workspaces |
| `GET` | `/api/observability/tool-calls` | Recent tool calls (limit 50) |

---

## Schemas (Structured Outputs)
All critical steps use shared schemas in `packages/shared/`:
- `Plan` — planner output (intent + tool actions)
- `ToolCall` — tool call arguments (validated)
- `ToolResult` — stored results with checksums/row counts
- `VerifierReport` — evidence checks and blockers
- `Answer` — final response + citations

> If you add/change a schema, update:
- this README
- any docs in `docs/`
- tests and fixtures

---

## SQL Safety (AST-based)
The SQL policy must:
- parse to an AST (no regex-based “validation”)
- enforce SELECT-only + single statement
- force LIMIT (server-side)
- enforce allowlist tables/columns
- produce user-friendly, actionable errors

---

## Observability & Audit
Local CRM AI Studio stores:
- tool call inputs (sanitized)
- tool outputs (structured) + checksums + row counts
- timings and trace IDs

Studio surfaces:
- tool call timeline
- SQL visibility
- evidence/citations per answer
- errors and policy blocks

---

## Code Commenting & File Headers (mandatory)
- All comments and docstrings must be in **English**.
- Every source file must start with a **file header block** describing:
  - what the module/component does
  - why it exists
  - key invariants/constraints

TypeScript example:
```ts
/**
 * @file <short title>
 * @description <what this module does and why it exists>.
 * @remarks <key invariants / important constraints>.
 */
```

Vue SFC example:
```html
<!--
@file <short title>
@description <what this component does and why it exists>.
@remarks <key invariants / important constraints>.
-->
```

---

## Testing

### Run unit/integration tests
```bash
pnpm test
```

### Run E2E tests
```bash
pnpm test:e2e
```

### Required test coverage (DoD)
- SQL gating tests (AST safety + limits)
- verifier tests (no evidence → no answer)
- integration test: plan → tools → verify → answer
- E2E: streaming chat + evidence drawer + source CRUD

---

## Troubleshooting

### The assistant answers without citations
This is a bug. Fix by:
- ensuring final answers must return `Answer.citations[]`
- verifier rejects any answer with unsupported claims
- Studio displays citations and blocks “uncited” messages

### SQL blocked by policy
- Check allowlisted tables/columns
- Ensure query is SELECT-only and single statement
- Ensure LIMIT is present (or allow server to inject)

### Ingestion doesn’t find content
- Verify file paths and permissions
- Check ingestion logs and failed documents list
- Confirm embeddings model is reachable

---

## Roadmap (Post-MVP)
- Add more connectors (MongoDB, REST APIs with allowlists, etc.)
- Add workspace multi-tenancy hardening (RLS, per-tenant schema options)
- Add background job queue (Redis/SQS adapters)
- Add cloud adapters (AWS) without rewriting orchestrator:
  - storage (S3), secrets (Secrets Manager), DB (RDS/Aurora), vector store options

---

## Documentation Policy (mandatory)
Whenever you change:
- environment variables
- routes/endpoints
- schemas
- migrations
- connectors
- safety rules
- UX flows or screens

…you must update this README and any relevant docs in the same PR.

---

## License
See [LICENSE](LICENSE) for details.
