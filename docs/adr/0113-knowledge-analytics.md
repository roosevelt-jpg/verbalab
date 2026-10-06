# ADR-0113: Knowledge Analytics (this cloud only, not BI OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-202 (library “Phase 69 Knowledge Analytics” mapped)

## Context

Library Phase 69 asks for Knowledge Growth/Usage/Quality/Search Success/Gaps/Confidence/Relationships plus dashboard, reports, REST/SDK, monitoring, docs, and production deployment.

ROADMAP VL-202: usage/quality analytics for Knowledge Cloud surfaces. Out of scope: regenerating Language/Speech/Voice/Intelligence analytics or shipping an enterprise BI suite.

## Decision

1. Ship **Knowledge Analytics** hub under `/v1/knowledge-analytics/*` + console `/knowledge-analytics`.
2. Aggregate from Knowledge Cloud tables (documents/chunks/KG/taxonomy) and knowledge-related audit actions only.
3. Provide overview, growth, usage, quality, search, gaps, confidence, relationships, report, monitoring.
4. Mark enterprise reports deferred; honesty flags reject regenerating sibling analytics clouds and BI OS claims.
5. Flip Knowledge Cloud catalog `knowledge-analytics` to partial; deferred flag → false.

## Consequences

- Knowledge Cloud marks knowledge-analytics `partial` with hub links.
- Knowledge Cloud Production Audit (VL-203) closes the volume with evidence; no new knowledge features during audit.
