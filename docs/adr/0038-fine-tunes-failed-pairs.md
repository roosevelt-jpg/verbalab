# ADR-0038: Fine-tunes for failed pairs

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-104

## Context

VL-100 coverage shows where vendor MT is weak on tiny EN→African goldens. VL-101 holds licensed corpora. A full GPU training platform (VL-111) and W&B-scale registry (VL-110) are funding-gated. We still need an honest product path: detect candidates, record jobs, attach artifacts, and serve them via the gateway.

## Decision

1. **Candidates:** Flags pairs where `exactMatchRate < 0.5` or `meanCharSimilarity < 0.4` (or unevaluated golden focus pairs). Heuristic only — not a training mandate.
2. **Thin registry + jobs:** `model_registry` + `fine_tune_jobs` (minimal VL-110/111). Launchers: `manual` (default) or `modal` (requires tokens; never invents success).
3. **Artifacts:** `phrase_map` (local JSON from goldens — CI/demo) or `http_endpoint` (rented inference URL). Completing a job can promote one ready model per pair.
4. **Gateway:** Prefer ready fine-tune for the pair; on miss/error fall back to the default Google/fixture provider. Provider name: `finetune`.
5. **Gating:** Pro + owner/admin for create/launch/complete/retire. Candidates + model list are readable to signed-in console users.
6. **Out of scope:** Internal GPU clusters, foundation models (VL-112), fake Modal success without wiring.

## Consequences

- CI proves routing with phrase maps without rented GPUs.
- Real training remains external; operators attach artifacts when done.
- Broader registry/MLOps stays deferred to funded VL-110/111; VL-110 later extended the same table for vendor defaults (ADR-0039). VL-111 added rented-GPU launch webhooks + callbacks (ADR-0040).
