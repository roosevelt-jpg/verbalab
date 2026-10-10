# ADR-0182: Research Cloud Production Audit (VL-280)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-280 (library Phase 147 Production Audit)

## Context

Library Phase 147 asks for a Research Cloud Production Audit — hardening/review, not new features. Volume 13 covers VL-271–279 (foundation through research analytics). Risks: inventing W&B/MLflow/HF/DOI/USPTO/public-leaderboard OS, dropping synthetic labels, open-releasing traditional knowledge without Volume 12 consent, or inventing AI Sovereignty Cloud beyond scope.

## Decision

1. **Treat VL-280 as a review gate / checklist**, not a feature phase. Evidence pack under `docs/research-cloud-audit/`.
2. **Gate with vitest** (`research-cloud-audit.spec.ts`): no TODO/FIXME markers; all Volume 13 products shipped; synthetic labeling; open-science consent; auth smoke on overview; GraphQL engines queryable.
3. **Reject inventing** AI Sovereignty Cloud, W&B/MLflow OS, Hugging Face hub OS, DOI registry OS, USPTO OS, or public leaderboard OS in this volume.
4. **Mark Volume 13 closed** in PROGRESS.md, CLOUD_BLUEPRINT.md, and RESEARCH_CLOUD.md.
5. AI Sovereignty / MLOps Platform recommendations → Volume 14+ when scheduled.

## Consequences

- Volume 13 (VL-271–280) closes with honest incubation coverage and safety flags.
- Synthetic artifacts remain labeled; traditional-knowledge open releases remain consent-gated.
- AI Sovereignty Cloud remains deferred.
