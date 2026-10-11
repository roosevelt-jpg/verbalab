# Lugemi Everyday — implementation guide

Version 1.1 | 11 October 2026 | Implemented product specification

## 1. Objective

Daily-use experience inside Lugemi: photograph or upload a document, hear a faithful translation, request a separate plain-language explanation, ask grounded questions, and compose a reviewed reply in a preferred language.

Three modes: **Read this to me**, **Help me reply**, **Explain this word**. All three are wired end to end.

Reuse Lugemi OCR, translate, TTS, storage, auth, billing, and Language Assurance patterns. Do not rebuild parallel platforms.

## 2. Scope (fully implemented)

Mobile-first browser UI with authenticated private sessions, camera/image/PDF/text input, image-quality checks, layout-aware OCR blocks, source preview and correction, supported corridors, translated text/audio, separate grounded explanations, follow-up questions, reviewed replies, contextual term explanations, private history, and deletion.

Configurable limits: 10 pages, 20 MB upload (env-overridable). Handwriting, encrypted PDFs, and unsupported scripts fail explicitly.

Deferred by product policy (not stubs): automatic government form filing, payment actions, clinical diagnosis, legal interpretation as advice, offline inference, arbitrary messaging integrations, automatic external send.

Medical/legal/financial categories require `sensitivePolicyOk`. Explanations always carry an advice disclaimer.

## 3–14. Contracts

Domain, adapters, APIs, events, privacy, and acceptance cases match the original product specification and are implemented under:

- API: `apps/api/src/everyday/`
- Prisma: `Everyday*` models + migration `20261011050000_everyday`
- Web: `apps/web/app/everyday/`
- SDK: `packages/sdk/src/everyday.ts` → `client.everyday`
- Tests: `apps/api/test/everyday.spec.ts`
- Ops: `docs/everyday/RUNBOOK.md`, `docs/everyday/VERIFICATION.md`

Entitlement key: `everyday` (Pro+). Feature flags / env: see RUNBOOK.
