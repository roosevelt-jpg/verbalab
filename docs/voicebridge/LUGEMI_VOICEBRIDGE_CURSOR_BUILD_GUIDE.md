# Lugemi VoiceBridge — Cursor build guide

Version 1.0 | 10 October 2026 | Proposed implementation specification

## 1. Objective and agent mandate

Build VoiceBridge inside existing Lugemi: a private multilingual voice thread where a sender records once and each recipient receives text and spoken translation in their chosen supported language. Recipients reply in their own language. Corrections remain linked to the original message, propagate to every authorized recipient, and clearly supersede outdated versions. Selected conversation evidence can become a proposed DealBridge deal.

Product promise: **Speak once. Connect across languages.**

Inspect repository instructions, manifests and actual services before coding. Reuse existing authentication, tenancy, UI components, model adapters, media storage, queues, events, usage metering and observability. No framework, language coverage, model performance or deployed feature is assumed by this document. Verify installed versions locally and use current official documentation when needed.

This guide authorizes implementation work, not production deployment, paid provisioning or external customer messages. Do not advertise global novelty or guaranteed accuracy. Use existing supported models first; train specialized adapters only when evaluation demonstrates a need.

## 2. MVP boundary

Include private threads, authenticated invitation redemption, participant language preferences, voice/text messages, source transcript review, translated text/audio, voice replies, questions, versioned corrections, receipt/acknowledgment tracking, constrained offline drafts, and DealBridge draft handoff.

Initial configurable limits: 10 participants per thread, five minutes per recording, and 20 MB per upload. Confirm these limits against actual infrastructure; enforce duration after decoding as well as size before upload. Select one language corridor for the pilot based on verified ASR, translation and TTS coverage. Africa first; architecture supports additional regions without presuming equal coverage.

Defer WhatsApp/Telegram delivery, telephone calls, live simultaneous interpretation, public broadcast feeds, payment execution, automatic voice cloning and a marketplace. Platform integrations require permission/API validation and separate rollout. MVP notifications are in-app; reuse already authorized channels only under explicit recipient preferences.

## 3. User journey and screens

1. Creator starts a thread with a title and optional business category. Invitation links expire, are single-use, and bind an authenticated identity to membership.
2. Each member chooses a language/variety and accepts processing/recording notices. Training permission is optional and separate.
3. Sender records, previews and submits. ASR produces a draft transcript; sender reviews critical terms and can edit before publishing. Do not imply a machine transcript is sender-confirmed before review.
4. Publish atomically creates an immutable source revision and thread event. Generate recipient-language variants grouped by identical supported language/variety and translation settings.
5. Recipient sees translated content, the original transcript/audio, language labels, processing/uncertainty status, and playback controls. Reply or ask a question tied to that exact revision.
6. Sender corrects a published message. Create a new revision, mark old content superseded, regenerate variants and place a persistent correction notice in each authorized member's thread.
7. Recipients can explicitly acknowledge a correction. Playback, delivery and acknowledgment are distinct; none establishes understanding or agreement.
8. Authorized parties can select messages and prepare a DealBridge draft. Terms remain proposed until DealBridge completes its own verification and confirmations.

Screens: thread list; thread creation/invitations; conversation; record/preview/transcript review; source/translation comparison; correction history; language settings; DealBridge selection preview; restricted admin coverage/cost view.

Use existing Lugemi design tokens. Accessible controls, keyboard navigation, screen-reader labels, readable contrast, text alternatives and no automatic audio playback. Show unsupported-language capability clearly. Do not use national flags as language names or infer language from nationality.

## 4. Service design

Flow: capture → validated upload → ASR draft → sender review → immutable publication → translation → critical-term checks → TTS → authorized variant retrieval → member reply/correction.

Adapters: SpeechRecognizer, Translator, SpeechSynthesizer, CriticalTermVerifier, MediaStore and EventPublisher. Each result carries sourceRevisionId, language/variety, adapter/model version and processing status. Use a durable queue with retries, backoff, dead-letter handling and operator recovery. Treat transcripts as untrusted data; embedded instructions cannot change permissions or invoke actions.

For identical recipients, reuse a generated variant only within the same tenant/thread/revision/settings and authorization boundary. Cache keys include tenant, thread, source revision, source hash, language/variety, glossary version, translation settings, model versions and synthesis voice/settings. Do not deduplicate private audio across tenants by publicly observable hashes.

Independent per-language failure must not block other supported recipients. Text can be ready while TTS is pending or unavailable; distinguish these states. Budget fan-out before generation and meter actual processing rather than multiplying an estimate by recipients. Provider credentials stay server-side.

## 5. Data model and invariants

| Entity | Contract |
| --- | --- |
| Thread | id, tenantId, creatorId, title, active/archived state, retention policy, server sequence |
| Membership | threadId, userId, role, active status, language preference version, joinedAt, notifications; unique active user/thread |
| Invitation | threadId, hashed token, expiresAt, redeemedBy, scope; single-use atomic redemption |
| Message | id, threadId, authorId, activeRevisionId, replyToMessageId and replyToRevisionId, state |
| SourceRevision | messageId, revision number, original audio reference, reviewed transcript, language/variety, supersedesId, correction reason, author, hash; immutable after publication |
| LanguageVariant | sourceRevisionId, target language/variety, text, audio reference, provenance, model/settings versions, verification state, content hash; immutable when presented |
| DeliveryRecord | memberId, revisionId, variantId, availableAt, playback telemetry and explicit acknowledgmentAt; distinct fields |
| ProcessingJob | scope, sourceRevisionId, expectedActiveRevisionId, idempotency key, stage, attempts, cost and error classification |
| Consent | userId, purpose, notice version, decision, timestamp |
| AuditEvent | actor, thread, operation, revision, server timestamp; restricted append-only metadata |
| DealDraftLink | thread, selected revision IDs/hashes, initiator, named deal parties, DealBridge draft ID, staleSince and handoff key |

Source edits retain original evidence subject to retention/deletion policy. No published revision or presented translation is overwritten silently. A provider-generated fix to presented translation creates a new variant version, links the old variant, and notifies affected users. If its meaning changes, mark affected DealBridge evidence stale as well.

Message states: draft, uploading, transcribing, awaiting_review, published, withdrawn, deleted. Source revisions can be current or superseded. Variant states: queued, translating, verifying, text_ready, synthesizing, ready, needs_clarification, failed, unsupported. Model uncertainty is separate from infrastructure failure.

## 6. Corrections, races and delivery guarantees

Correction request includes expectedActiveRevisionId. In one transaction, authorize author, validate precondition, append source revision, update active pointer, create correction event and outbox jobs, and mark associated draft evidence stale. Reject stale edits with conflict; never merge commercial meaning automatically.

Workers are at-least-once. Stage idempotency keys and unique records prevent duplicate effects. Old jobs may finish as historical results but cannot replace current content or trigger a “current message ready” notification. Clients reconnect using server sequence and deduplicate event IDs. Do not promise exactly-once network delivery.

Display corrections even to recipients who never played the original. Recheck membership before media authorization, job delivery and notifications. Current members regain the active version on reconnect. Former members receive nothing further.

If an old version is currently playing when a correction arrives, pause playback where possible and show the correction immediately; retain access to history only when authorized. An offline/downloaded copy cannot be remotely erased or guaranteed fresh. Label cached audio with revision and last sync time, and check current state on reconnect. Do not claim all recipients have received a correction until their respective server/client records support that claim.

## 7. Critical details and quality handling

Detect names, numbers, currency, quantities, unit definitions, dates, negations and payment/delivery conditions with source span provenance. Deterministic validation checks numeric consistency and explicit currency/unit equivalence. Native-reviewed terminology can preserve local product names. Unknown units or ambiguous dates require sender clarification; do not invent conversions.

Example verification result:

```json
{
  "sourceRevisionId": "rev_2",
  "targetLanguage": "fr",
  "status": "needs_clarification",
  "issues": [{"kind": "quantity_mismatch", "sourceSpan": "50 bags", "translatedSpan": "15 sacs"}],
  "modelVersion": "configured_verifier_version"
}
```

Block spoken delivery of variants with unresolved critical discrepancies; show processing/clarification status and permitted original evidence. Retry controlled generation or request human review. Critical-term extraction is not proof of semantic correctness. Calibrate confidence per corridor before presenting numeric probabilities. Never silently fall back through another language or provider with different retention rules.

## 8. Low-bandwidth and offline behavior

Negotiate browser recording codecs by actual support; do not assume every browser records Opus. Validate and normalize server-side using installed media tooling. Provide a tested compact speech encoding with a compatible fallback. Suggested experiment: 24–32 kbps mono speech, judged against critical-term recognition and listening quality, not a universal quality promise.

Use resumable uploads supported by existing storage, bounded chunks, upload IDs and checksum/offset validation. Resume only authenticated ownership. Clean abandoned uploads. Display byte progress and retry errors. Paginate thread history; retrieve audio on demand. Never download every language variant automatically.

Offline drafts are opt-in, time-bounded and stored with explicit device-risk notice. Use available platform encryption where feasible; do not describe browser storage as hardware-secured. Restrict drafts and playback caches to the authenticated account, clear on logout and enforce size/TTL limits. Background browser work is best-effort; provide foreground retry. Server publication and current-revision validation require connectivity.

## 9. API and events

Use current repository API conventions; illustrative routes:

| Endpoint | Behavior |
| --- | --- |
| POST /voicebridge/threads | Create private tenant-scoped thread |
| POST /threads/{id}/invites | Authorize creator/moderator; expiring invitation |
| POST /threads/{id}/join | Authenticate and redeem atomically |
| PATCH /threads/{id}/members/me | Version language/notification preferences |
| POST /threads/{id}/uploads | Bounded media upload authorization |
| POST /threads/{id}/messages | Create text/audio draft with idempotency key |
| POST /messages/{id}/publish | Publish reviewed transcript; expected draft revision |
| POST /messages/{id}/corrections | Append correction; expected active revision |
| GET /threads/{id}/messages | Cursor pagination with active revision status |
| GET /revisions/{id}/variants | Authorized current/history text and short-lived media access |
| POST /revisions/{id}/acknowledgments | Explicit acknowledgment; revision-bound |
| POST /threads/{id}/deal-drafts | Authorized selection preview then draft creation |
| DELETE /messages/{id} | Retention-aware deletion request |

Define schema validation, authorization, rate limits, error envelope and idempotency for every mutation. Same key/different payload returns conflict. Upload validation checks content type, size, decodability and duration; sandbox media processing. Membership removal revokes new reads and signed URL creation; issued URLs may remain valid until their short expiry, which must be disclosed and bounded.

Events: message.published, variant.text_ready, variant.audio_ready, message.corrected, variant.superseded, clarification.required, processing.failed, membership.changed and deal_draft.stale. Envelope: eventId, tenantId, threadId, sequence, messageId, sourceRevisionId, variantVersion, timestamp and correlationId. Minimal payload, no raw audio or sensitive transcript logging.

## 10. DealBridge integration

Integrate through existing DealBridge draft service if available. Otherwise define a disabled capability and adapter contract; do not fake successful handoffs.

Initiator selects messages and two named prospective deal parties, previews evidence, then explicitly creates a draft. Enforce that selected evidence is current and both parties are authorized for it. MVP handoff is within the same tenant. For cross-tenant trades, design an explicit shared-session authorization model before enabling access.

Draft input: threadId, selected sourceRevisionIds/hashes, relevant variantVersions, source languages, parties, category, proposed terms with source provenance and idempotency key. Store evidence revision references and detect subsequent correction, deletion or variant meaning changes. Invalidate draft review/confirmations through DealBridge's revision mechanism, never directly modify its receipt state.

Neither playback nor correction acknowledgment creates a deal confirmation. DealBridge must conduct its own review, explain-back and independent version-bound confirmation. Already issued receipts remain historical; a later correction flags source changes and requires explicit amendment, not automatic receipt rewriting. If evidence permissions change, preserve only legally/policy-permitted receipt data and show unavailable evidence honestly.

## 11. Security, privacy and retention

Thread membership plus tenant isolation applies to every read, event subscription and media request. Creator/moderator manages membership; authors edit their own messages; moderators may withdraw content but cannot impersonate an author correction. Training consent cannot be a condition for normal service access.

Encrypt media in transit/at rest using existing services. Private storage, short-lived scoped URLs, no public transcript indexing. A thread is not end-to-end encrypted merely because transport/storage encryption exists: server/provider processing may access plaintext. Communicate that accurately.

Configure retention for drafts, media, transcripts, variants, analytics and backups. Implement deletion propagation and job cancellation/tombstones so late workers cannot resurrect deleted content. Audit metadata must minimize retained content. Withdrawals and exports follow actual policy; do not promise erasure from recipient devices or trained weights. Never clone a sender's identity as the default translated voice; use licensed neutral voices with clear translated-audio labeling.

## 12. Build phases and repository deliverables

1. Discovery: repository gap map, language capability matrix, integration interfaces, planned file changes and configuration needs.
2. Domain: migrations/indexes, membership authorization, versioned source/variant entities, state machine, transactions, idempotent outbox and tests.
3. Messaging: recording, uploads, transcript review, publication, language-specific jobs, playback, replies and resumable event delivery.
4. Corrections: history, stale-job rejection, notices, revision-bound acknowledgment and draft invalidation.
5. Efficiency/privacy: resumable transfers, compact encoding, account-scoped cache, retention/deletion, provider usage limits and metering.
6. DealBridge: explicit selection, evidence preview, real draft adapter and lifecycle tests.
7. Pilot: accessibility, mobile browsers, noisy/code-switched evaluation, observability, demo and tenant/corridor feature flag.

Deliver working repository code, migrations/security rules as applicable, configuration example without secrets, real adapter setup, fixtures restricted to test/demo, unit/integration/end-to-end tests, coverage/evaluation report, cost dashboard and operational runbook. Required operational alerts: queue age, dead letters, generation errors, correction propagation failures, unexpected fan-out costs and deletion failures. Include feature-flag rollback and durable-job recovery.

## 13. Acceptance tests and quality gates

- One message to three members in two target languages generates two authorized variants, each tied to the same source revision.
- Sender review is required before publication; unsupported ASR/TTS is explicit.
- Reply retains its referenced original revision even after correction and displays that context as superseded.
- Correction from 50 to 15 reaches active members in their languages and prevents old worker output becoming current.
- Concurrent correction conflicts; repeated API requests/jobs/events do not duplicate messages, variants or billing charges.
- Recipient language change selects/generates a new supported variant without editing source history.
- Offline recipient reconnects to current revision and correction notice; cached content shows last-sync/version warnings.
- Interrupted upload resumes without duplicate publication; malformed/oversized/over-duration media is rejected.
- Critical discrepancy blocks spoken variant; injected instructions cannot perform privileged actions.
- Removed member cannot fetch media or subscribe; no cross-tenant cache/event leakage.
- Deletion during generation cannot resurrect content; caches and derived objects honor retention policy.
- Handoff creates only a draft; later correction invalidates active review; issued receipt is never rewritten.
- Screen reader, keyboard, iOS Safari and Android Chrome flows tested on available devices/environments; report untested environments.

Evaluate original and compressed audio on independent native-reviewed samples, including names, numbers, negations, background noise and code switching. Compare against existing Lugemi services. Report critical error escape, intelligibility, correction arrival-to-availability p50/p95, per-language failure rate, transcript-review burden, byte usage and cost per source minute/delivered variant. Quality thresholds are corridor-specific and declared before pilot; no achieved accuracy is assumed.

## 14. Pilot and commercial evidence

Start with merchants already communicating across one supported corridor. Measure real weekly active senders/recipients, recipient reply rate, four-week repeat use, completed conversations, correction acknowledgment, abandonment, DealBridge draft creation and paid conversion. Track failures and unacknowledged corrections, not only successful deliveries. Separate staff/demo activity from real usage.

Add server-side events and metric definitions with observation windows. Restrict admin exports and exclude transcripts/audio from analytics. Track ASR, translation, verification, TTS, storage, retries and notification costs separately. Generation costs scale with unique variants; delivery/storage costs can still scale with recipients. Test pricing against actual costs and paid demand. Do not present proposed adoption as investor traction.

## 15. Cursor starting prompt

> Build VoiceBridge into the existing Lugemi repository using this guide. Inspect repository instructions and working services first, map gaps and then implement reversible local changes using the existing stack. Prioritize private membership, immutable message revisions, per-language variants, explicit sender review and reliable correction propagation. Make stale jobs, events and offline caches unable to masquerade as current content. Preserve original evidence under retention policy, enforce tenant isolation, and keep playback/acknowledgment distinct from agreement. Implement DealBridge handoff only through a real draft adapter with provenance and invalidation; otherwise show the unavailable capability honestly. Deliver code, migrations, setup documentation, meaningful tests, a labeled demo and verification report. Do not deploy, provision paid resources or send external invitations without separate authorization.
