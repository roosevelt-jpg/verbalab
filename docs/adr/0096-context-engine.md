# ADR-0096: Context Engine (assemble retrieval + memory + prompt)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-185 (library “Phase 52 Context Engine” mapped)

## Context

Library Phase 52 asks for conversation/document/org/project/language/user/workspace/historical context, compression, retrieval, plus REST/GraphQL/SDK, realtime, monitoring, docs, and production deployment.

ROADMAP VL-185 goal: assemble retrieval + memory + prompt context. Out of scope: infinite context window product claims. Dependencies: VL-180, VL-182, VL-183 (KG optional).

## Decision

1. Ship **Context Engine** hub under `/v1/context-engine/*` + console `/context-engine`.  
2. **`POST /assemble`** pulls from workspace/org language defaults, Memory Cloud scopes, Vector/Knowledge search (when `query` set), Knowledge Graph entity list, and Prompts resolve.  
3. **Compression** = priority-ordered char budget truncation (`maxChars`). Defer LLM summarization.  
4. Do **not** claim infinite context or realtime context push.  
5. Persist nothing new — audit `context_engine.assembled` only.  
6. Keep Intelligence catalog `partial` with honesty flags.

## Consequences

- Chat/RAG can later call assemble instead of ad-hoc string building.  
- Reasoning Cloud (VL-186) may consume `promptContext` for multi-step prompts.  
- Realtime streaming context remains deferred.
