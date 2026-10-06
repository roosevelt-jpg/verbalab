# ADR-0079: Speech Cloud Production Audit (VL-160)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-160 (library Phase 26 Speech Cloud Production Audit)

## Context

Library Phase 26 asks to validate the entire Speech Cloud: no TODOs/placeholders/mocks, integrated APIs/billing/analytics/monitoring/security, load/performance/stress/realtime/security/accessibility testing, and readiness/architecture/coverage/deployment reports. It also claims Speech Cloud will “exceed a basic transcription API” and power contact centers, language learning, compliance, analytics, and multilingual voice — then introduces a 12-layer cloud blueprint.

Production Audit phases are **review gates**, not feature factories. Competitor-parity or “exceed Deepgram/AssemblyAI/Gong” marketing is rejected under honesty rules (ADR-0069–0078). Inventing k6/axe platforms is also rejected (same pattern as ADR-0068).

## Decision

1. Treat VL-160 as a **checklist + evidence pack** over VL-150–159 (plus supporting VL-041/042/061/064/120/121/132 speech surfaces).
2. Ship audit tests (`speech-cloud-audit.spec.ts`): TODO scan, catalog integration, auth rejection, bounded load/stress smoke, SSE realtime smoke, GraphQL façade.
3. Publish reports under `docs/speech-cloud-audit/` and point deployment to existing `infra/DEPLOY.md` / `infra/AWS_EKS.md`.
4. Record honest verdict: VerbaLab Speech Cloud is a **bounded speech intelligence hub** in the Nest modular monolith — capable of supporting contact-center / learning / compliance / analytics / voice workflows **within documented honesty limits**, not a multi-vendor speech OS.
5. Accept the **12-layer VerbaLab Cloud Blueprint** as an architecture standard in ADR-0080 (separate decision) — map existing Language/Speech clouds to it; do not invent empty Voice/Vision clouds in this audit.
6. Close Speech Cloud volume; next cloud work requires new ROADMAP phases.

## Consequences

- Speech Cloud volume is closed with evidence, not marketing.
- Future clouds (Voice, Vision, …) must follow ADR-0080 layers without regenerating shared Identity/Gateway/Billing.
