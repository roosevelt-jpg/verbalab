# ADR-0094: Memory Cloud (persistent memory with GDPR delete/export)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-183 (library “Phase 50 Memory Cloud” mapped)

## Context

Library Phase 50 asks for conversation/workspace/org/project/agent memory, long/short/shared/semantic memory, versioning, search, plus REST/GraphQL/SDK, dashboard, monitoring, analytics, and production deployment.

ADR-0091 and the Volume 5 README require a real **deletion/export path before real user data**. Infinite personalization without RTBF is out of scope. Translation Memory (VL-051) is a different product.

## Decision

1. Ship **Memory Cloud** hub under `/v1/memory-cloud/*` + console `/memory-cloud`.  
2. Store rows in Postgres `memory_records` with scope/kind, optional subject/agent/project/conversation keys, version, `expiresAt`, soft `deletedAt`.  
3. Ship **`POST /export`** and **`POST /erase`** (confirm required) alongside writes.  
4. Include memory rows in org workspace export (`POST /v1/organization/export`); org delete cascades via FK.  
5. Search is case-insensitive text contains for MVP; embedding/NN semantic memory deferred.  
6. Do **not** auto-wire chat completions into memory (chat remains client-owned until explicit opt-in later).  
7. Automated retention sweeper remains deferred; expired rows are filtered on read.

## Consequences

- Intelligence Cloud marks memory `partial` with hub links; `deferred.memoryCloud=false`.  
- `docs/data-map.md` lists `memory_records`.  
- Context Engine (VL-185) can later assemble these rows into prompts.
