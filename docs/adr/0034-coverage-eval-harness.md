# ADR-0034: Coverage matrix and golden eval harness

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-100

## Context

African differentiation needs measurable MT quality before fine-tunes (VL-104). Heuristic QE (ADR-0012) is not reference-based. We need small golden sets, an automated harness vs the vendor gateway, and a public page that does not overclaim.

## Decision

1. **Goldens:** Hand-authored EN→`sw` / `yo` / `am` segments in `src/eval/goldens.ts` (not a licensed corpus dump). Expand under VL-101 with licensed data.
2. **Metrics:** Normalized exact-match rate + character similarity (Levenshtein). Not BLEU/COMET yet.
3. **Runner:** `EvalService.runAll(mode)` via active `GatewayService` provider. Modes: `fixture` (CI), `reference_oracle` (harness sanity), `live` (requires `EVAL_LIVE=1`).
4. **Snapshot:** `eval/results/latest.json` + in-memory cache; public `GET /v1/coverage` merges registry + focus-pair scores.
5. **Public page:** `/coverage` (Clerk public) with honest disclaimer. `POST /v1/eval/run` is Clerk owner/admin.

## Consequences

- CI proves the harness without Google keys.
- Live vendor scores are optional and cost money.
- Page never claims leadership — only measured reference metrics on tiny sets.
