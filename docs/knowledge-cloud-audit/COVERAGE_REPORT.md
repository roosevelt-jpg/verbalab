# Knowledge Cloud — Coverage Report (VL-203)

**Date:** 2026-10-03

## Suite coverage (Knowledge Cloud volume)

Vitest Istanbul/v8 line coverage is **not configured** in `apps/api`. This report tracks **suite presence + gate execution**, not % LOC.

| Area | Spec files |
| --- | --- |
| Foundation | `knowledge-cloud.spec.ts` |
| KB / Search | `knowledge-base.spec.ts`, `enterprise-search.spec.ts`, `knowledge.spec.ts` |
| Ontology / Taxonomy | `ontology-platform.spec.ts`, `taxonomy-platform.spec.ts` |
| RAG / Memory / Intel | `enterprise-rag.spec.ts`, `knowledge-memory.spec.ts`, `knowledge-intelligence.spec.ts` |
| APIs / Analytics | `knowledge-apis.spec.ts`, `knowledge-analytics.spec.ts` |
| Related | `knowledge-graph.spec.ts`, Intelligence suites |
| Security | `tenant-isolation.spec.ts`, auth checks in audit |
| Audit gate | `knowledge-cloud-audit.spec.ts` |

## Accessibility

No dedicated axe/Playwright a11y suite for Knowledge consoles. Evidence:

- Public Playwright: `apps/web/e2e/public.spec.ts`
- Knowledge consoles use semantic headings/labels/forms
- **Gap (honest):** automated WCAG audit deferred; run manual keyboard/contrast pass before marketing “a11y certified”

## Load / stress / benchmarks

Bounded sequential catalog smokes only (see Performance Report). Not load/stress/search/knowledge certificates.
