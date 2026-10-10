# ADR-0175: Synthetic Data Platform (VL-273)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-273 (library Phase 140)

## Context

Volume 13 Research Cloud needs an internal Synthetic Data Platform surface for R&D incubation. Risks: inventing Weights & Biases / Hugging Face / DOI / USPTO / MLflow / public-leaderboard OS, or inventing AI Sovereignty Cloud in this volume.

## Decision

1. Ship `synthetic-data-platform` as a Nest hub (catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console).
2. Keep honesty flags explicit on the engine catalog.
3. Extend existing Intelligence/Knowledge/Foundation Model / evaluation surfaces — do not regenerate Volumes 1–12.
4. Defer AI Sovereignty Cloud to Volume 14+.

## Consequences

- Synthetic Data Platform is discoverable via Research Cloud foundation catalog.
- Production Audit (VL-280) gates honesty and completeness.
