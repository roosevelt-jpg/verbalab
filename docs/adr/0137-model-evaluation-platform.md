# ADR-0137: Model Evaluation Platform (hub over VL-100, not LMSYS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-236 (library “Phase 103 Model Evaluation Platform” mapped)

## Context

Library Phase 103 asks for enterprise model evaluation: MMLU, HumanEval, MT Bench, translation/speech/vision/reasoning benchmarks, bias, safety, latency — plus leaderboards, reports, analytics.

VL-100 already ships a golden translation coverage harness (ADR-0034) with honest disclaimers. Inventing fake MMLU scores or a public SOTA leaderboard would violate Volume 9 honesty and engineering standards.

## Decision

1. **Ship VL-236 as an evaluation hub** — `/model-evaluation-platform` + engine/suites/runs/leaderboard/reports/monitoring.
2. **Runnable suites:** translation (handoff to VL-100), bias/safety/latency (sandbox heuristics).
3. **Defer:** MMLU, HumanEval, MT Bench, speech/vision/reasoning corpora.
4. **Leaderboards:** org-scoped ranks from local runs only — `globalLeaderboardOs: false`, `sotaClaimsForbidden: true`.
5. **Do not regenerate** VL-100 (`regeneratesVl100: false`).
6. **Architecture:** Nest modular monolith; CQRS GraphQL façade for suites; `hexagonalRewrite: false`.

## Consequences

- Operators get a discoverable eval surface without fake academic suite scores.
- Model Registry (VL-237) and FMC Production Audit (VL-238) remain next on the MLOps track.
