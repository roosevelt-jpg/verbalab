# ADR-0257 — Lugemi MeetingBridge

## Status

Accepted (2026-10-11)

## Context

Cross-language meetings routinely lose owners, quantities, and deadlines between speech, captions, and minutes. Lugemi already provides authentication, tenancy, translation adapters, Voice Studio terminology, DealBridge confirmations, and VoiceBridge follow-up. MeetingBridge composes those into multilingual rooms with revision-linked evidence and explicit, policy-bound confirmations — not a claim of legal enforceability, guaranteed comprehension, or simultaneous interpretation without provisioned media.

## Decision

1. Implement MeetingBridge as a Nest feature module (`apps/api/src/meetingbridge`) with Prisma domain entities (migration `20261011030000_meetingbridge`) and a Next.js console (`/meetingbridge`, `/meetingbridge/meetings/[id]`, `/meetingbridge/join/[token]`).
2. Keep meeting and item state authoritative on the server with explicit state machines. AI drafts never mark items confirmed. Silence, presence, playback, and AI summaries are never agreement.
3. Default approval policy: actions require every named owner plus organizer; decisions require the named authority plus designated affected approvers.
4. Corrections append utterance revisions, mark dependent item revisions stale, and supersede already confirmed/declined items so history is preserved and fresh confirmation is required.
5. Gate entitlement with plan feature `meetingBridge` (Pro+), overridable via `featureOverrides.meetingBridge`, `MEETINGBRIDGE_OPEN=1`, or kill-switched with `MEETINGBRIDGE_DISABLED=1`.
6. Media honesty: without `MEETINGBRIDGE_MEDIA_URL`, rooms use controlled turn-taking and phrase-level captions (`phrase_upload`), not advertised as live simultaneous interpretation.
7. Fixture MT only when `NODE_ENV=test` or `MEETINGBRIDGE_ALLOW_FIXTURE_MT=1`, and labeled in adapter responses.
8. Expose the same surface via TypeScript, Android, and iOS SDKs (`client.meetingBridge`).

## Consequences

- Verified corridors start with `en-ak`, `en-ee`, and `en-fr`; ASR/TTS remain capability-gated per corridor.
- Zoom/Teams bots, public broadcasts, autonomous task writes, and paid SFU provisioning stay out of scope until separately authorized.
- DealBridge handoff from a meeting creates a proposed deal only; MeetingBridge confirmation is not a commercial receipt.
