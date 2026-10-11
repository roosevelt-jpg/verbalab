# Lugemi MeetingBridge — Cursor build guide

Version 1.0 | 11 October 2026 | Proposed implementation specification

## 1. Product and build mandate

Build MeetingBridge inside Lugemi: multilingual meetings with supported listening channels, revision-linked transcripts, reviewed decisions and explicitly confirmed action plans. Participants speak their preferred languages, inspect translations and leave with a shared record of confirmed items and unresolved disagreements.

Inspect repository instructions, actual meeting/live interpretation services, usable models and installed dependencies first. Reuse Lugemi authentication, tenant roles, media infrastructure, language adapters, UI, storage, jobs, notifications and metering. A blueprint or configured language label does not prove working speech or media support.

Implement reversible development. Production deployment, paid infrastructure, external invitations and third-party task writes require separate authorization. Do not claim global novelty, guaranteed understanding or legally binding agreements. This specification is a product hypothesis, not evidence of market leadership.

## 2. MVP boundary and sequencing

Initial scope: private authenticated browser audio rooms, up to six participants as a configurable planning limit, one verified language corridor, agenda and terminology preparation, source captions, supported translated audio/text, decisions/actions board, explicit participant confirmation, post-meeting review and private exports.

Begin with reliable controlled turn-taking and phrase-level committed translation. Add full-duplex simultaneous interpretation only when the existing stack passes interruption, multi-speaker and latency tests. If live models are unavailable, ship a clearly labeled post-meeting transcript/review mode; do not advertise it as live interpretation.

Defer Zoom/Teams/Meet bots, public broadcasts, automatic legally binding resolutions, lip sync, payments and unrestricted autonomous task execution. The room audio service needs actual provisioning/configuration; documented setup blockers must not be hidden behind a simulator.

## 3. Participant journey

1. Organizer creates room with agenda, meeting timezone, supported languages, participant list and explicit decision-approval policy.
2. Participants authenticate, redeem scoped expiring invitations and see AI-processing/recording notices. Recording, processing and optional training permission remain distinct.
3. Each chooses speaking/listening language and supported variety. Run microphone/headphone checks and a language sample. Do not infer language from nationality or voice identity.
4. Participants speak in turn. Display original and translated captions with speaker labels, provisional/committed status and uncertainty. Listening mode selects original, translated or captions-only; prevent doubled playback.
5. Draft proposals, decisions and actions link to source utterance revisions. Unknown owners/dates remain unknown. AI drafts are visually distinct from reviewed records.
6. Participants correct their own transcript or flag another speaker's words for review. Corrections append revisions and mark dependent records stale.
7. Review each decision's exact wording and each action's owner/deadline in each affected person's language. Collect explicit confirm, change request or decline against the exact item/presentation revision.
8. Close the meeting, finalize outstanding transcript/translation work, and publish versioned reviewed minutes with confirmed, pending, disputed and unresolved sections.
9. Authorized users export or explicitly sync approved tasks. Later changes create amendments and fresh confirmations; no silent rewriting of prior minutes/tasks.

Absence, silence, playback, reaction emoji and an AI summary are not agreement. Leaving the room does not authorize the organizer to confirm for another person. Host approval is separate from action-owner acceptance.

## 4. Screens and accessibility

Use existing Lugemi tokens/components. Screens: meeting library, create/invite, agenda/terminology preparation, lobby audio check, room with captions/language controls, decisions/actions board, confirmation inbox, correction history, reviewed minutes/export and restricted admin diagnostics.

Accessible keyboard/mute controls, readable contrast, speaker labels, captions, text alternatives and no autoplay of recordings. Participants may type contributions and confirmations. Show exact dates and timezone; do not require color alone to distinguish pending/confirmed. Keep network/translation states visible without exposing model implementation details in normal user flows.

## 5. Media and speech architecture

Use the repository's existing WebRTC/SFU or compatible media service. If absent, evaluate current official documentation and hosting/network constraints before integrating one. Include TURN connectivity, authenticated room tokens, track ownership and participant lifecycle. Do not use generic broadcast WebSockets as a replacement for an unimplemented audio conferencing service.

Separate original microphone tracks from synthesized language-channel tracks. Bind authenticated participant IDs to originating tracks. Diarization, if needed for mixed recordings, is an uncertain speaker label, not identity authentication. Do not mix synthesized output back into ASR. Headphone guidance and echo cancellation are necessary but not guarantees.

Adapters: MeetingMedia, SpeechRecognizer, Translator, SpeechSynthesizer, TerminologyResolver, ItemExtractor, MeaningVerifier and TaskExporter. Pin model/voice/terminology versions. Per-speaker turn IDs, timestamps and generation epochs prevent late/reordered chunks from appearing current.

Commit source phrases before spoken translation. Provisional captions can update; already played audio cannot be recalled. If meaning changes, issue an explicit translated repair and correction notice. Queue bounded audio by speaker/channel; warn about backlog. If overlap makes interpretation unreliable, request turn-taking rather than dropping a speaker invisibly.

Reuse identical language/variety/settings outputs within the authorized room. Member removal revokes future track subscription and media access. Optimize fan-out but measure generation and media-delivery costs separately. No silent routing to an unsupported model/provider.

## 6. Domain schema

| Entity | Required contract |
| --- | --- |
| Meeting | tenantId, organizer, agenda, timezone, state, supported corridor, terminology snapshot, approval policy, retention |
| Membership | authenticated participant, role, speaking/listening preferences, presence, scoped permissions |
| Invitation | hashed token, scope, expiry, redemption; single-use transaction |
| UtteranceRevision | speaker/track, turn ID, start/end times, original transcript, audio reference if retained, language, parent revision, commit state |
| TranslationRevision | source revision, target variety, text/audio hashes, model versions, status and correction link |
| MeetingItemRevision | item ID, kind, wording, owner(s), deadline, conditions, source references, required approvers, revision/hash |
| ReviewPresentation | participant, item revision, language, exact wording, optional audio hash and translation provenance |
| ItemConfirmation | authenticated actor, item hash, presentation hash, explicit action, timestamp and idempotency key |
| Disagreement | participant, item revision, proposed correction/reason, open/resolved status |
| MinutesRevision | ordered selected items and transcript snapshot, unresolved sections, policy, full hash; immutable |
| ExportOrSync | exact minutes/item versions, destination, authorization, status, external IDs and idempotency key |
| Audit/Consent/Usage | purpose-specific notices, operations, media/model costs; restricted minimal metadata |

Action example, proposed and not yet confirmed:

```json
{
  "kind": "action",
  "revision": 1,
  "description": "Dispatch 50 bags of rice",
  "ownerParticipantIds": ["participant_id"],
  "dueDate": "2026-10-16",
  "timeZone": "Africa/Accra",
  "conditions": [],
  "sourceRevisionIds": ["utterance_revision_id"],
  "requiredApproverIds": ["participant_id", "organizer_id"],
  "state": "proposed"
}
```

Validate schema, source evidence, quantities, dates and owner identifiers. Relative dates require explicit resolution in the meeting timezone. Do not infer an action owner merely from who was speaking; ask when ambiguous. Separate quoted ideas, proposals, decisions, requests and commitments.

## 7. Approval policy and states

Meeting states: scheduled, lobby, live, processing, reviewing, minutes_issued, cancelled. Closing live media does not finalize pending model results or approvals.

Item states: proposed, reviewing, clarification_required, partially_confirmed, confirmed, declined, disputed, superseded, cancelled. The server computes these from explicit records and the pinned policy; the model cannot mark an item confirmed.

Default MVP policy: each action requires every named owner plus organizer approval. A decision requires the named decision authority and explicitly designated affected approvers; list this scope visibly. Do not describe an authority-approved item as unanimous consensus. Changing approver membership/policy creates a new item revision and requires renewed review, never a shortcut to approval.

Each person reviews their own immutable translated presentation for the same item revision. Confirmation is separate from comprehension checks; optional explain-back can identify mismatches but is not proof of understanding.

Changes to wording, owner, quantity, deadline, conditions, approval policy or participant-facing meaning invalidate outstanding confirmations. Transcript/source correction marks dependent items stale immediately; require authorized review even if an extractor suggests values stayed the same. Preserve history and require new confirmation when material or reviewed wording changes.

## 8. Consistency and correction propagation

Mutations use expected revision, idempotency key, role checks and transactional compare-and-set. Same key/different payload conflicts. Duplicate/out-of-order media events and workers cannot create duplicate items, exports or notifications.

Use source-to-item dependency indexes. Correction transaction appends source revision, updates active pointer, marks downstream translations/items/minutes drafts stale and emits an outbox event. Workers verify active generation/source epoch before promotion. Keep historical results without presenting them as current.

All members see the relevant correction in their chosen supported language. Reconnected members resume server sequence and current status. Delivered audio and offline exports cannot be remotely erased; display amendment links and version metadata. Already issued minutes remain historical, with a supersession indicator outside their immutable payload.

If an exported task is affected, flag it pending review and propose an amendment. Do not silently change its deadline or obligations. Idempotent sync reconciles external IDs/status and reports destination errors.

## 9. API and event contract

Follow existing namespaces; illustrative endpoints:

| Endpoint | Purpose |
| --- | --- |
| POST /meetingbridge/meetings | Create scoped meeting/policy |
| POST /meetings/{id}/invites | Authorized expiring invitations |
| POST /meetings/{id}/join | Authenticated redemption and scoped media token |
| PATCH /meetings/{id}/members/me | Language/listening preferences |
| POST /meetings/{id}/utterance-corrections | Revision-linked speaker correction or review request |
| POST /meetings/{id}/items | Proposed evidence-linked item |
| POST /items/{id}/revisions | Authorized amendment with expected revision |
| POST /items/{id}/confirmations | Explicit confirm/change/decline |
| POST /meetings/{id}/close | Stop live meeting and begin finalization |
| POST /meetings/{id}/minutes | Issue reviewed exact-version minutes |
| POST /minutes/{id}/exports | Private immutable export |
| POST /items/{id}/sync | Explicit authorized destination write |

Events: participant.joined/left, transcript.provisional/committed/corrected, translation.ready/repaired, item.proposed/stale/confirmed/disputed, minutes.ready/issued and integration.failed. Include event ID, tenant/meeting, sequence, source/item revision, actor and timestamp. Avoid raw audio/private transcript in generic logs. Authorize event subscriptions and replay.

Tool/model inputs cannot grant permissions, mint media tokens or write to external services. Retrieved agenda/notes are untrusted content. Apply schema validation, rate limits, quotas and allowlisted adapters.

## 10. Minutes and exports

MVP: readable Markdown and machine-readable JSON containing attendance/presence qualification, agenda, reviewed decisions, confirmed actions, unconfirmed proposals, disagreements and unresolved questions. Include named approval scope and timestamps; do not turn absence into consent. Audio links are private and retention-bound.

Manifest pins source/translation/item/minutes revisions, hashes, terminology/model versions and approvals. Approval records are workflow evidence, not legal certification. Export can pin a historical issued version even if a new draft exists, but cannot silently export another version.

Optional CSV tasks follow actual schema; use safe filenames and protect spreadsheet formula injection. Additional PDF/DOCX or task integrations reuse existing validated exporters/adapters.

Task sync is explicit, destination-authorized and restricted to confirmed active items. Later amendments require a previewed authorized update. Do not invoke Slack/email/calendar tools or customer systems just because an LLM inferred an action.

## 11. Integrations with Lugemi

Reuse Voice Studio pronunciation/terminology snapshots where model compatible; do not silently update a meeting's pinned vocabulary midstream. Reuse VoiceBridge for authorized asynchronous follow-up only after explicit selection and recipient permission.

DealBridge handoff creates a proposed two-party deal from selected evidence; meeting confirmation is not a commercial receipt confirmation. DealBridge must independently verify terms and obtain its own version-bound confirmations. If modules are unavailable, adapters show honest disabled states. Avoid duplicating state machines and privacy code where existing tested services can be reused.

## 12. Privacy and operational controls

Room auth plus tenant/meeting membership applies to tracks, transcripts, items, event streams and media. Cross-organization guests join an explicitly scoped host-tenant meeting; their organization membership does not grant wider tenant access. Participant roles do not authenticate a real-world identity beyond the actual sign-in process.

Explain live AI processing, persistent recording and retention separately. Declining recording follows the configured alternative; live transcription still processes speech. Server-side interpretation is not end-to-end encryption even if transport/storage are encrypted. No automatic training or cloning from participants' voices.

Define retention/deletion for recordings, transcripts, translations, exports, caches and backups; deleting inputs tombstones jobs to prevent resurrection. Immutable history is subject to applicable deletion policy. Private links expire; downloaded copies cannot be revoked. Minimize analytics and restrict quality-review access.

Set room duration/concurrency caps, language fan-out budgets and spend limits. Observe media loss, ASR/translation lag, synthesized queue age, corrections, confirmation conflicts, export errors and deletion failures. Feature flags per tenant/corridor and graceful captions/turn-taking/human fallback support rollback.

## 13. Build phases and acceptance tests

1. Repository/media/model discovery, gap map, verified corridor and hosting requirements.
2. Room/membership auth, language settings, notices, real microphone/media and accessible captions.
3. Reliable turn-taking interpretation, track ownership, committed phrase policy and correction notices.
4. Evidence-linked proposed items, deterministic critical-field checks, independent participant review and exact-version confirmation.
5. Dependency invalidation, versioned reviewed minutes, exports and explicit integration adapters.
6. Native review, network/overlap tests, costs, operational runbook and pilot rollout flag.

Acceptance tests:

- Unauthorized room/media/event access and cross-tenant reads fail.
- Authentic speaker track maps to correct participant; overlap/uncertain diarization cannot fabricate ownership.
- Original and translated listening modes avoid duplicate playback/feedback.
- Unsupported varieties and missing TTS expose fallback honestly.
- Late chunks after interruption/leave cannot play as current speech.
- AI proposal, silence or presence never creates confirmation.
- Two owners require both confirmations plus pinned policy approval.
- Changed owner/deadline/wording invalidates stale confirmations transactionally.
- “50” versus “15,” negation and relative-date ambiguity require review.
- Source correction marks dependent items/minutes drafts stale; issued minutes are not rewritten.
- Repeated jobs/events/exports/task sync are idempotent; late jobs cannot resurrect deleted content.
- Guest permission removal revokes new subscriptions and access.
- External sync failure is reported; no unauthorized messages or tasks are sent.
- Keyboard/screen-reader and available Safari/Chrome/mobile flows pass; disclose untested environments.

Test real multi-client audio with controlled loss, jitter, reconnects, muted speakers and overlapping speech. Synthetic media fixtures supplement but do not prove production conferencing performance. Native speakers review actual corridor interpretation and item meaning.

Deliver code, migrations/indexes/rules, config example without secrets, real adapter setup, isolated labeled demo, tests, native evaluation plan, verification results and operations/rollback instructions. Missing infrastructure/credentials are explicit blockers; no fixture-only completion claim.

## 14. Pilot and quality gates

Pilot recurring supplier/logistics coordination in one verified corridor. Benchmark against existing translation plus manual minutes. Measure critical meaning errors, falsely confirmed items, owner/deadline accuracy, correction propagation, unresolved-item visibility, interpretation lag, task completion evidence, repeat meetings and cost per participant-hour.

Prespecify quality/latency targets and review sample sizes per corridor. Zero unauthorized approvals in the software suite is mandatory but not a guarantee of perfect real-world comprehension. Human ratings assess pronunciation, tone, fluency and meaning; signal checks alone cannot certify native speech.

Use repeat usage and a real paid offer to test demand. Do not claim market leadership from a demonstration. Gate expansion on credible quality, usable coordination, sustainable costs and actual customer evidence.

## 15. Cursor starting prompt

> Implement MeetingBridge in the existing Lugemi repository from this guide. Inspect repository instructions, real media infrastructure and usable language models first. Reuse the stack and start with one verified corridor and reliable controlled turn-taking. Build private authenticated rooms, language channels/captions, revision-linked evidence, proposed decisions/actions, explicit policy-bound confirmations and reviewed minutes. Never infer agreement from silence or an AI summary. Make corrections invalidate dependent drafts and approvals, preserve historical issued records and reject stale workers. Implement only real authorized integrations; label unsupported capabilities and simulation honestly. Deliver code, migrations, setup docs, meaningful tests, a labeled demo and verification report. Do not deploy, provision paid resources, invite external participants or write to third-party systems without separate authorization.
