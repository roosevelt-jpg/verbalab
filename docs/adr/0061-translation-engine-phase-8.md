# ADR-0061: Translation Engine Phase 8 (VL-140)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-140 (library Phase 8 Translation Engine)

## Context

Library Phase 8 asks for VerbaLab Translate covering realtime/batch/streaming, many file formats, messaging channels (SMS/WhatsApp/Teams/Slack), website/email, plus TM/glossary/quality, REST/GraphQL/SDK/CLI, monitoring, analytics, docs, and tests.

Much of this already shipped across VL-022–053, VL-044, VL-082. Claiming website localization or WhatsApp Business APIs would be fake completeness.

## Decision

1. Publish an honest **engine catalog** at `GET /v1/translate/engine`.
2. Add production format codecs for **HTML, Markdown, XML, CSV, SRT** via `POST /v1/translate/formats`.
3. Add **SSE streaming** at `POST /v1/translate/stream` and **chat message MT** at `POST /v1/translate/chat`.
4. Expose GraphQL `translate` / `translateFormat`; expand SDK + CLI.
5. Keep DOCX/PDF on the existing document job path; keep Slack as the only messaging connector.
6. Explicitly defer website, email-body MT, WhatsApp, Teams, SMS, PPTX, XLSX.

## Consequences

- Phase 8 “Generate” surfaces are covered without inventing channel platforms.
- Further Office formats or channel connectors need new ADRs.
