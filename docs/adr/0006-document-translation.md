# ADR-0006: Local document storage + parser buy

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-040

## Context

Document translation needs upload, text extraction, chunked MT (VL-022), and a downloadable result. Building a PDF layout engine is out of scope.

## Decision

- Accept **DOCX** and **PDF** uploads (size-capped via `DOCUMENT_MAX_BYTES`, default 5 MiB). Plain `.txt` allowed for tests/dev convenience.
- Extract with **mammoth** (DOCX) and **pdf-parse** (PDF).
- Re-pack DOCX with the **docx** library. PDF inputs produce **plain text** output (no PDF renderer).
- Store bytes on local disk under `DOCUMENT_STORAGE_DIR` (default `apps/api/storage`). Object storage (S3) arrives when multi-instance deploy needs it.
- Processing runs as job type `document_translate` on the VL-044 queue; clients poll `GET /v1/jobs/:id` and download via `GET /v1/documents/:id/content`.

## Consequences

- Single-node storage is fine for MVP; migrate keys/paths when adding S3.
- Scanned image-only PDFs need VL-043 OCR later.
