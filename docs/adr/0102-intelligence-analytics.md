# ADR-0102: Intelligence Analytics (this cloud only)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-191 (library “Phase 58 Intelligence Analytics” mapped)

## Context

Library Phase 58 asks for reasoning/memory/knowledge/embeddings/latency/quality/confidence/model-routing/cost/enterprise reports plus dashboard, REST/GraphQL/SDK, monitoring, reports, docs, and production deployment.

ROADMAP VL-191: usage/quality analytics for Intelligence Cloud surfaces. Out of scope: regenerating Language/Speech/Voice analytics.

## Decision

1. Ship **Intelligence Analytics** hub under `/v1/intelligence-analytics/*` + console `/intelligence-analytics`.  
2. Aggregate from `usage_events` (chat/embeddings) and Intelligence Cloud audit actions only.  
3. Provide overview, usage, surfaces, latency, quality, routing, costs, report, monitoring.  
4. Mark enterprise reports deferred; honesty flags reject regenerating sibling analytics clouds and BI OS claims.  
5. Do not clone Speech/Voice analytics endpoints.

## Consequences

- Intelligence Cloud marks intelligence-analytics `partial` with hub links.  
- Intelligence Cloud Production Audit (VL-192) closes the volume with evidence (ADR-0103); no new intelligence features during audit.
