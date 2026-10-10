# Voice Cloud — Coverage Report (VL-179)

**Date:** 2026-10-03

## Suite coverage (Voice Cloud volume)

Vitest Istanbul/v8 line coverage is **not configured** in `apps/api`. This report tracks **suite presence + gate execution**, not % LOC.

| Area | Spec files |
| --- | --- |
| Foundation | `voice-cloud.spec.ts` |
| Neural TTS | `neural-tts.spec.ts`, `tts.spec.ts`, `own-tts.spec.ts` |
| Cloning | `voice-cloning.spec.ts`, `voice-clones.spec.ts` |
| Emotion / studio / enhancement | `emotion-voice.spec.ts`, `voice-studio.spec.ts`, `voice-enhancement.spec.ts` |
| Biometrics / marketplace / analytics | `voice-biometrics.spec.ts`, `voice-marketplace.spec.ts`, `voice-analytics.spec.ts` |
| Related | `audio.spec.ts`, `voice-agents.spec.ts` |
| Security | `tenant-isolation.spec.ts`, auth checks in audit |
| Audit gate | `voice-cloud-audit.spec.ts` |

## Accessibility

No dedicated axe/Playwright a11y suite for Voice consoles. Evidence:

- Public Playwright: `apps/web/e2e/public.spec.ts`
- Voice consoles use semantic headings/labels/forms
- **Gap (honest):** automated WCAG audit deferred; run manual keyboard/contrast pass before marketing “a11y certified”

## Load / stress / streaming

Bounded sequential + parallel catalog smokes and TTS chunk-SSE smoke only (see Performance Report). Not load/stress/streaming certificates.
