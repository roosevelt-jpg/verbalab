# Language Cloud — Coverage Report (VL-147)

**Date:** 2026-09-07

## Suite coverage (Language Cloud volume)

Vitest Istanbul/v8 line coverage is **not configured** in `apps/api` (`vitest.config.ts` has no coverage provider). This report tracks **suite presence + gate execution**, not % LOC.

| Area | Spec files |
| --- | --- |
| Foundation / CQRS | `language-cloud.spec.ts`, `language-cloud-cqrs.spec.ts`, `graphql.spec.ts` |
| Registry / countries | `enterprise-language-registry.spec.ts`, `country-packs.spec.ts` |
| Translate engine | `translation-engine.spec.ts`, `detect.spec.ts`, `glossary*.spec.ts`, `tm*.spec.ts`, `quality*.spec.ts` |
| Localization | `localization-platform.spec.ts`, `localize*.spec.ts`, `locales.spec.ts` |
| Grammar / style / LI | `grammar*.spec.ts`, `style*.spec.ts`, `language-intelligence.spec.ts` |
| Analytics | `analytics*.spec.ts`, `language-analytics.spec.ts` |
| Security | `tenant-isolation.spec.ts`, auth 401 checks in audit |
| Audit gate | `language-cloud-audit.spec.ts` |

## Accessibility

No dedicated axe/Playwright a11y suite is shipped. Evidence:

- Public Playwright: `apps/web/e2e/public.spec.ts`
- Console pages use semantic headings/labels in Language Cloud UIs
- **Gap (honest):** automated WCAG audit deferred; run manual keyboard/contrast pass before marketing “a11y certified”

## Load

Bounded sequential catalog smoke only (see Performance Report). Not a load certificate.
