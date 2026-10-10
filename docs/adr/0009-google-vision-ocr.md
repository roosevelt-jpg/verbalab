# ADR-0009: Google Vision for OCR

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-043

## Context

VL-043 needs vendor OCR (image/PDF → text) with optional translate. Roadmap options: Google Document AI or Azure Document Intelligence. Both need project processors/endpoints beyond a simple API key. We already use Google Translate with an API key.

## Decision

- Use **Google Cloud Vision** `DOCUMENT_TEXT_DETECTION` via `images:annotate` (API key).
- Credential: `GOOGLE_VISION_API_KEY`, falling back to `GOOGLE_TRANSLATE_API_KEY` when unset (same GCP key often enables both APIs).
- Accept **images** (png/jpeg/webp/gif), size-capped (`OCR_MAX_BYTES`, default 8 MiB). Scanned PDFs: upload page images for now; digital PDFs stay on VL-040 document translate.
- `POST /v1/ocr` multipart `file` + optional `languageHint`, optional `source`/`target` to chain VL-022 after OCR.
- Meter `usage_events` with `feature=ocr`, `unitType=pages`.
- Upgrade path: Google Document AI / Azure DI behind the same `OcrProvider` interface when layout/tables are required.

## Consequences

- Multi-page PDF OCR is deferred (needs GCS/async or page rasterization).
- Vision API must be enabled on the GCP project for the key.
