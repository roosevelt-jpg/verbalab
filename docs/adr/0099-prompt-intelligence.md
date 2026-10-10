# ADR-0099: Prompt Intelligence (extend versioning, not research lab)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-188 (library “Phase 55 Prompt Intelligence” mapped)

## Context

Library Phase 55 asks for registry/versioning/testing/evaluation/marketplace/security/analytics/optimization/approval plus REST/GraphQL/SDK, dashboard, monitoring, docs, and production deployment.

ROADMAP VL-188: prompt management/optimization hub over versioned prompts. Buy vs build: **extend existing prompt versioning**. Out of scope: auto-prompt research lab.

## Decision

1. Ship **Prompt Intelligence** hub under `/v1/prompt-intelligence/*` + console `/prompt-intelligence`.  
2. Reuse **VL-086** `PromptsService` for registry/resolve; keep CRUD on `/v1/prompts`.  
3. Add **preview**, **heuristic evaluate**, and **security pattern scan** — no LLM-as-judge or evolutionary optimizer.  
4. Surface marketplace prompt listings via existing VL-091 marketplace.  
5. Treat admin **activate** as approval proxy; dedicated approval workflow deferred.  
6. Mark **prompt-optimization** deferred (research lab).

## Consequences

- Intelligence Cloud marks prompt-intelligence `partial` with hub links.  
- AI Decision Engine (VL-189) ships bounded helpers (ADR-0100), not Drools/Pega parity.
