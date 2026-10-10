# ADR-0139: Foundation Model Cloud Production Audit (VL-238)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-238 (library Phase 105 Foundation Model Cloud Production Audit)

## Context

Library Phase 105 asks to validate Foundation Model Cloud: no TODOs/placeholders/mocks; training/serving/evaluation/registry/monitoring operational; architecture/coverage/performance/deployment/readiness reports; “END OF FOUNDATION MODEL CLOUD”; and a strong pitch for **AI Fabric**.

Production Audit phases are **review gates**, not feature factories (same pattern as ADR-0134). Inventing trained Atlas weights, MLflow/LMSYS OS, or AI Fabric mesh in this audit is rejected. Volume 9 README already constrained Cursor to MLOps scaffolding.

## Decision

1. Treat VL-238 as a **checklist + evidence pack** over VL-224 + VL-235–237 (MLOps track). Named-model scaffolds VL-225–234 remain deferred by design.  
2. Ship audit tests (`foundation-model-cloud-audit.spec.ts`): TODO scan, catalog integration, auth rejection, Training/Eval/Registry operational smokes, GraphQL façades, honesty flags.  
3. Publish reports under `docs/foundation-model-cloud-audit/` and point deployment to existing `infra/DEPLOY.md` / `infra/AWS_EKS.md`.  
4. Record honest verdict: FMC is a **bounded MLOps/platform volume** — not frontier weights or OpenAI replacement.  
5. Record AI Fabric as a **Volume 10 recommendation only** — do not implement here.  
6. Confirm Volume 9 MLOps track closes; optional VL-225–234 scaffolds later if useful.

## Consequences

- Foundation Model Cloud volume (hub + MLOps) is closed with evidence, not marketing.  
- Operators must keep rented-GPU launchers and live eval opt-in until intentionally configured.  
- Volume 10 AI Fabric requires new ROADMAP phases — ask when ready.
