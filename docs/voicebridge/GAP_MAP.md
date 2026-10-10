# VoiceBridge discovery gap map

Inspected against Lugemi monorepo (Nest API, Next web, Prisma, DealBridge, Audio/Translate services). Africa-first pilot corridor: `en-fr` (`VOICEBRIDGE_PILOT_CORRIDOR`).

## Reused

| Capability | Source |
| --- | --- |
| Auth / tenancy | Clerk + API keys, org/workspace headers |
| Storage | `LocalStorageService` for media keys |
| ASR / MT / TTS | `AudioService` / `TranslateService` + fixture adapters when flags set |
| Plans / flags | `voiceBridge` plan entitlement + `VOICEBRIDGE_*` env |
| DealBridge | `DealBridgeService.createSession` draft adapter |
| UI shell | Existing `app-shell` nav + `vl-*` tokens |

## Implemented (MVP slice)

- Prisma Voice* models + migration `20261010173000_voicebridge`
- Thread / invite / join / member prefs / draft / publish / correct / ack / playback / deal-draft APIs
- Immutable source revisions, per-language variants, `expectedActiveRevisionId` concurrency
- Critical-term verifier (quantity mismatch blocks spoken delivery)
- Sync processing path with job records (outbox-shaped); stale revision guards
- Web: thread list, join, conversation, sender review, record, DealBridge selection
- Tests: state machine, hash, verifier, HTTP publish + two variants + stale correction
- Runbook + feature-flag rollback

## Deferred / remaining vs guide

| Gap | Notes |
| --- | --- |
| Durable async worker + DLQ recovery UI | Jobs table exists; no separate queue worker process yet |
| Resumable chunked uploads | Upload auth stub; multipart create is bounded but not resumable |
| Offline draft / playback cache UI | Labels only; no IndexedDB TTL cache yet |
| Admin coverage/cost dashboard | Metering hooks partial; no restricted admin view |
| Corridor eval report | Fixtures only; no native-reviewed sample suite |
| WhatsApp/Telegram/phone | Explicitly out of MVP |

## Configuration (no secrets)

See `.env.example` `VOICEBRIDGE_*` and `docs/voicebridge/RUNBOOK.md`.
