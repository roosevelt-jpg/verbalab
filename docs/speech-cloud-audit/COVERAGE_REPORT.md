# Speech Cloud — Coverage Report (VL-160)

**Date:** 2026-09-07

## Suite coverage (Speech Cloud volume)

Vitest Istanbul/v8 line coverage is **not configured** in `apps/api`. This report tracks **suite presence + gate execution**, not % LOC.

| Area | Spec files |
| --- | --- |
| Foundation | `speech-cloud.spec.ts` |
| Recognition | `speech-recognition.spec.ts`, `audio.spec.ts`, `tts.spec.ts` |
| Speaker / accent / emotion | `speaker-intelligence.spec.ts`, `accents.spec.ts`, `emotion-intelligence.spec.ts` |
| Audio / pronunciation / wake | `audio-intelligence.spec.ts`, `pronunciation-intelligence.spec.ts`, `wake-word.spec.ts` |
| Call / analytics | `call-intelligence.spec.ts`, `speech-analytics.spec.ts` |
| Related | `interpret.spec.ts`, `voice-clones.spec.ts`, `own-tts.spec.ts` |
| Security | `tenant-isolation.spec.ts`, auth checks in audit |
| Audit gate | `speech-cloud-audit.spec.ts` |

## Accessibility

No dedicated axe/Playwright a11y suite for Speech consoles. Evidence:

- Public Playwright: `apps/web/e2e/public.spec.ts`
- Speech consoles use semantic headings/labels/forms
- **Gap (honest):** automated WCAG audit deferred; run manual keyboard/contrast pass before marketing “a11y certified”

## Load / stress / realtime

Bounded sequential + parallel catalog smokes and SSE smoke only (see Performance Report). Not load/stress/realtime certificates.
