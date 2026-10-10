# ADR-0098: Recommendation Engine (light rankers, not retail OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-187 (library “Phase 54 Recommendation Engine” mapped)

## Context

Library Phase 54 asks for content/language/voice/translation/model/workflow/knowledge/enterprise recommendations plus REST/GraphQL/SDK, analytics, monitoring, docs, and production deployment.

ROADMAP VL-187: recommendations over embeddings/memory for workspace content/voices/languages. Buy vs build: **light rankers**. Out of scope: retail recommender OS.

## Decision

1. Ship **Recommendation Engine** hub under `/v1/recommendation-engine/*` + console `/recommendation-engine`.  
2. Implement **`POST /recommend`** with `kind` discriminators ranking existing catalogs (languages, TTS/marketplace voices, knowledge via Vector Cloud, embedding models, fixed workflow recipes).  
3. Optional memory text search as a soft ranking signal — not a CF user-item matrix.  
4. Reject `kind=enterprise` as deferred (cross-tenant personalization OS).  
5. Do **not** train ranking models, bandits, or feature stores.

## Consequences

- Intelligence Cloud marks recommendations `partial` with hub links.  
- Prompt Intelligence (VL-188) extends existing prompt versioning (ADR-0099), not an auto-prompt research lab.
