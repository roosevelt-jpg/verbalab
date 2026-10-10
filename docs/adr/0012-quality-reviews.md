# ADR-0012: Lightweight translation quality reviews

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-052

## Context

Buyers ask how quality is measured. Building a QE model company is out of scope. Google Translate Basic does not return segment confidence scores.

## Decision

- After each translate (including TM hits), create a `translation_reviews` row with a **heuristic** `qualityScore` (0–100) and `needsReview` when below `QUALITY_REVIEW_THRESHOLD` (default 70).
- Heuristic signals: empty target, identical-to-source, extreme length ratio, unresolved glossary placeholders; TM hits score ~98.
- Human workflow: `GET /v1/reviews`, `POST /v1/reviews/:id/accept|reject`. Accept optionally upserts TM (`addToTm` default true).
- Translate response includes `reviewId`, `qualityScore`, `needsReview`.
- Optional LLM second-pass is a future flag only — not shipped in VL-052.

## Consequences

- Scores are explanatory, not calibrated BLEU/COMET. Document that clearly in the console.
- High-volume orgs will want pagination/filters (already limited to 200).
