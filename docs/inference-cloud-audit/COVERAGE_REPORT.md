# Inference Cloud — Coverage Report (VL-213)

**Date:** 2026-10-03

## Suite coverage (Inference Cloud volume)

Vitest Istanbul/v8 line coverage is **not configured** in `apps/api`. This report tracks **suite presence + gate execution**, not % LOC.

| Area | Spec files |
| --- | --- |
| Foundation | `inference-cloud.spec.ts` |
| GPU / Serving / Router | `gpu-platform.spec.ts`, `model-serving.spec.ts`, `ai-router.spec.ts` |
| Streaming / Batch / Cache | `streaming-runtime.spec.ts`, `batch-runtime.spec.ts`, `intelligent-cache.spec.ts` |
| Cost / Analytics | `cost-optimization.spec.ts`, `ai-runtime-analytics.spec.ts` |
| Related | Gateway / models / chat suites (shared) |
| Security | auth checks in audit + TranslateAuthGuard on mutators |
| Audit gate | `inference-cloud-audit.spec.ts` |

## Accessibility

No dedicated axe/Playwright a11y suite for Inference consoles. Evidence:

- Public Playwright: `apps/web/e2e/public.spec.ts`
- Inference consoles use semantic headings/labels/forms
- **Gap (honest):** automated WCAG audit deferred; run manual keyboard/contrast pass before marketing “a11y certified”

## Load / stress / benchmarks

Bounded sequential catalog smokes only (see Performance Report). Not load/stress/GPU-benchmark certificates.
