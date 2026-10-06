# ADR-0068: Language Cloud Production Audit (VL-147)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-147 (library Phase 15 Language Cloud Production Audit)

## Context

Library Phase 15 asks to validate the complete Language Cloud: no TODOs/placeholders/mocks, integrated surfaces, security/performance/integration/load/API/accessibility tests, and architecture/performance/coverage/readiness/deployment reports. It also claims Lugemi is now comparable to Google Translate + DeepL + Microsoft Translator + Amazon Translate + Grammarly + LanguageTool + Crowdin + Phrase combined, then pivots to Speech Cloud.

That competitor-parity claim is false under Lugemi honesty rules (ADR-0051–0067). Production Audit phases are review gates, not feature factories and not Speech Cloud kickoff.

## Decision

1. Treat VL-147 as a **checklist + evidence pack** over VL-130–146 (and supporting M5 language products).
2. Ship audit tests (`language-cloud-audit.spec.ts`) covering TODO scan, catalog integration, auth rejection, bounded load smoke, and GraphQL façade.
3. Publish reports under `docs/language-cloud-audit/` and point deployment to existing `infra/DEPLOY.md` / `infra/AWS_EKS.md`.
4. Explicitly record: Lugemi Language Cloud is a **bounded enterprise language API hub**, not a multi-vendor parity suite.
5. **Do not** start Speech Cloud in this phase. Speech depth remains scheduled elsewhere (e.g. VL-041 vendor STT/TTS, VL-122) with vision backlog for research-grade speech intelligence.

## Consequences

- Language Cloud volume is closed with evidence, not marketing.
- Next volume (Speech) requires a separate ROADMAP phase and ADR — not this audit file.
