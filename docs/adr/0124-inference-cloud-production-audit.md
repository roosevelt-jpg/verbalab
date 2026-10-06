# ADR-0124: Inference Cloud Production Audit (VL-213)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-213 (library Phase 80 Inference Cloud Production Audit)

## Context

Library Phase 80 asks to validate the entire Inference Cloud: no TODOs/placeholders/mocks; GPU/autoscaling/serving/routing/monitoring operational; load/stress/GPU/latency/security tests; architecture/coverage/performance/readiness/deployment reports; and “everything production ready.” It also pitches a proprietary **VerbaLab AI Kernel** as the next OS layer.

Production Audit phases are **review gates**, not feature factories. GPU hyperscaler / vLLM mesh / Redis-vector CDN / FinOps Spot / BI-APM marketing is rejected under honesty rules (ADR-0115–0123). Inventing k6/axe/GPU-benchmark labs is rejected (same pattern as ADR-0068 / ADR-0114). AI Kernel is **Volume 8** — not an executable deliverable of this audit. Volume 7 README requires spend-safety verification (hard GPU ceilings + Cost Optimization **enforce**, not report-only).

## Decision

1. Treat VL-213 as a **checklist + evidence pack** over VL-204–212.  
2. Ship audit tests (`inference-cloud-audit.spec.ts`): TODO scan, catalog integration, auth rejection, spend-safety checks, bounded load + rapid stress smoke, GraphQL façade, honesty flags.  
3. Publish reports under `docs/inference-cloud-audit/` and point deployment to existing `infra/DEPLOY.md` / `infra/AWS_EKS.md`.  
4. Record honest verdict: VerbaLab Inference Cloud is a **bounded hub over AI Gateway + sandbox runtime surfaces** in the Nest modular monolith — GPU/serving/router/stream/batch/cache/cost/analytics **within documented honesty limits**, not a GPU hyperscaler or AI Kernel.  
5. Confirm the **12-layer VerbaLab Cloud Blueprint** (ADR-0080) mapping for Inference Cloud is complete (Foundation → Production Audit).  
6. Close Inference Cloud volume; do not invent AI Kernel here. Next work requires new ROADMAP phases (Volume 8 — ask when ready).

## Consequences

- Inference Cloud volume is closed with evidence, not marketing.  
- Operators must still set sandbox spend ceilings before connecting any real GPU billing account.  
- Future volumes must follow ADR-0080 layers without regenerating shared Identity/Gateway/Billing/Inference hubs.
