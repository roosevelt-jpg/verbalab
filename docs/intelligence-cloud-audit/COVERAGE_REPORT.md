# Intelligence Cloud — Coverage Report (VL-192)

**Date:** 2026-10-03

## Suite coverage (Intelligence Cloud volume)

Vitest Istanbul/v8 line coverage is **not configured** in `apps/api`. This report tracks **suite presence + gate execution**, not % LOC.

| Area | Spec files |
| --- | --- |
| Foundation | `intelligence-cloud.spec.ts` |
| Embeddings / Vector / Memory | `embedding-cloud.spec.ts`, `embeddings.spec.ts`, `vector-cloud.spec.ts`, `memory-cloud.spec.ts` |
| KG / Context / Reasoning | `knowledge-graph.spec.ts`, `context-engine.spec.ts`, `reasoning-cloud.spec.ts` |
| Recommend / Prompts / Decisions | `recommendation-engine.spec.ts`, `prompt-intelligence.spec.ts`, `decision-engine.spec.ts` |
| Orchestration / Analytics | `ai-orchestration.spec.ts`, `intelligence-analytics.spec.ts` |
| Related | `knowledge.spec.ts`, chat/gateway suites |
| Security | `tenant-isolation.spec.ts`, auth checks in audit |
| Audit gate | `intelligence-cloud-audit.spec.ts` |

## Accessibility

No dedicated axe/Playwright a11y suite for Intelligence consoles. Evidence:

- Public Playwright: `apps/web/e2e/public.spec.ts`
- Intelligence consoles use semantic headings/labels/forms
- **Gap (honest):** automated WCAG audit deferred; run manual keyboard/contrast pass before marketing “a11y certified”

## Load / stress / benchmarks

Bounded sequential catalog smokes only (see Performance Report). Not load/stress/reasoning/vector certificates.
