# Language Cloud — Architecture Report (VL-147)

**Date:** 2026-09-07  
**Scope:** VL-130–146 Language Cloud volume (+ supporting M5 language products)

## Verdict

Language Cloud is a **hub over Nest modular monolith services**, not a separate microservice mesh and not a linguistics OS. REST is primary; GraphQL is a façade; CQRS/hex applies to a Language Cloud application slice only (VL-137).

## System shape

| Layer | Reality |
| --- | --- |
| Runtime | NestJS API (`apps/api`) + Next.js console (`apps/web`) |
| Data | Postgres (+ pgvector) on `:5433` locally; Redis for jobs/rate limits |
| Hub | `GET /v1/language/products` + `/language` console |
| Deploy | Fly.io default; optional AWS EKS `af-south-1` |

## Capability map (honest)

| Product | VL | Status note |
| --- | --- | --- |
| Translate engine | 140 / 022+ | Vendor MT + formats/SSE — not website/WhatsApp TMS |
| Detection | 054 | Google + franc |
| Dialects / accents | 131–132 | Cue scoring — not acoustic phonetics ID |
| Grammar / style | 133–134, 142–143 | Rules + optional LLM — not Grammarly parity |
| Language intelligence | 144 | Heuristic NLP signals façade |
| Localization | 141 / 053 | ICU/QA — not Crowdin/Phrase TMS |
| TM / glossary | 051 / 050 / 145 | Exact + scoped TM — not MemoQ |
| Analytics | 085 / 146 | SQL aggregates — not BI cloud |
| Registry / countries | 139 / 135 | Curated catalogs — not Ethnologue/CLDR dump |

## Integration findings

- Catalogs are wired and discoverable (audit test hits all major hubs).
- Translate consumes TM lookup (workspace → enterprise/shared fallback).
- GraphQL resolvers import Language Cloud modules without regenerating REST.
- No TODO/FIXME/`implement later` markers found in Language Cloud source trees (audit scan).

## Explicit non-claims

VerbaLab Language Cloud is **not** comparable to Google Translate + DeepL + Microsoft Translator + Amazon Translate + Grammarly + LanguageTool + Crowdin + Phrase combined.
