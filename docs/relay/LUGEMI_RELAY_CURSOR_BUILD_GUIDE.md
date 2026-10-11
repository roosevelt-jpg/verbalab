# Lugemi Relay — Cursor agent build guide

Version 1.1 | 11 October 2026 | Implemented product specification

## 1. Objective and mandate

Build a real human-interpreter fallback inside Lugemi. A user can request help for a supported language pair/variety, book a qualified interpreter, approve the price and context sharing, and join a private interpreted session. The interpreter receives authorized context and unresolved questions without impersonating a user or replacing their confirmations.

Start with scheduled bookings for one corridor and general business/everyday conversations. Instant availability is later scope and must reflect actual staffed supply. Software cannot create qualified interpreters or guarantee continent-wide coverage.

Inspect repository instructions and actual auth, scheduling, media, billing, support, review and language services. Reuse existing modules/models/stack. Missing integrations or interpreter supply remain explicit blockers. This document authorizes reversible development, not recruitment outreach, paid provisioning, payment capture/payouts, deployment or external messages.

## 2. Product scope

Include request creation, verified interpreter profiles, approved scope/qualifications, availability slots, deterministic matching, expiring offers, quotes, bookings, explicit context consent, private browser audio sessions, completion/dispute workflow and admin operations.

Launch only general-domain interpretation. Medical, legal and other regulated/high-stakes work is disabled until domain credentials, policies and jurisdiction requirements have been independently reviewed. A fluent bilingual speaker is not automatically a qualified interpreter.

Defer open public marketplace, automated credential certification, instant global routing, escrow, interpreter employment/payroll automation and guaranteed emergency response. Telephone bridging uses an existing verified adapter or remains disabled; browser sessions are a valid initial delivery mode.

## 3. User and interpreter journeys

1. User requests language pair/varieties, subject category, preferred time/timezone, expected duration and originating Lugemi context.
2. Show actual coverage and available slots. If none exist, offer a truthful waitlist/request state without charging or promising a match.
3. Matching selects qualified active interpreters with compatible language/domain/time availability. Interpreter explicitly accepts an expiring offer; user receives a pinned quote.
4. User accepts price, cancellation terms and selected context-sharing scope. Booking becomes confirmed only when staffing and any required payment state are valid.
5. Interpreter accepts confidentiality requirements and sees only scoped, authorized context. Meeting participants receive appropriate disclosure and sharing notices.
6. Participants authenticate to a private room. Confirm roles/languages, audio checks and recording preferences. Interpreter can clarify meaning but cannot confirm business terms for users.
7. Complete session, record actual service duration, collect feedback and issue an accurate invoice/payment record if supported.
8. Handle cancellation, no-show, dispute or refund through a documented human-operated process. Corrections are separate records; training use requires additional rights/permission.

## 4. Roles, qualification and matching

Roles: requester, authorized participant, interpreter, dispatcher, credential reviewer and billing/support admin. Scope access to bookings and tasks, not broad tenant browsing.

Profile includes identity verification level, claimed and verified language varieties, directionality, subject competence, assessed interpreting skill, qualifications/evidence, approval reviewer/date, availability timezone, service limits, confidentiality acceptance and suspension state. Badge wording must state actual checks; no AI certification or unsupported professional claims.

Native speakers/language educators and qualified interpreters should assess a structured sample before approval. Identity verification and linguistic competence are different checks. Review credentials manually where required; do not publish sensitive documents.

Matching uses verified qualifications, exact coverage, slot availability, user requirements and transparent operational rules. Do not rank by nationality or infer dialect from ethnicity. Respect blocked matches/conflicts of interest. Ratings supplement, not replace, qualification. Do not prioritize an unqualified candidate just to fill a booking.

## 5. Architecture and adapters

Relay application service orchestrates existing scheduler, authentication/tenant services, browser media, pricing/billing, notifications, originating-product context and support operations.

Adapters: InterpreterDirectory, AvailabilityScheduler, QuoteService, PaymentAdapter, ContextHandoff, SessionMedia, NotificationAdapter and DisputeService. Deterministic server code controls offer acceptance, reservation, payment gates, access and duration. Models may summarize context but cannot verify credentials, assign funds or approve bookings.

Cross-tenant handoff is disabled by default. A guest interpreter receives explicit scoped access to the host's booking/session, not membership in all host resources. Use internal authorized artifact references; no arbitrary URL downloads or automatic external messaging.

## 6. Domain schema

| Entity | Required contract |
| --- | --- |
| InterpreterProfile | user ID, verified coverage/domain, credential review, active/suspended state, confidentiality and license terms |
| AvailabilitySlot | interpreter, UTC start/end, display timezone, capacity, revision and reservation state |
| RelayRequest | tenant/requester, pair/varieties, category, preferred times/duration, origin refs, status |
| Offer | request/interpreter/slot, expiresAt, accepted/declined state; one active accepted assignment |
| QuoteSnapshot | currency, rates/minimums, taxes/fees, included duration, overrun policy, cancellation terms, version/hash |
| Booking | request, interpreter, reserved interval, accepted quote, payment mode/state, participants, lifecycle |
| ContextGrant | participant/owner, selected evidence revisions, purpose, scope, expiry and revocation |
| Session | booking, authenticated room, participants/roles, connected intervals, start/end and media state |
| UsageLedger | server/provider duration evidence, rate snapshot, adjustments and reconciliation |
| PaymentRecord | provider IDs, immutable amounts/currency, authorization/capture/refund state and idempotency |
| Dispute | booking, issue/evidence, assigned staff, outcome/reason; access-controlled |
| CorrectionRecord | source evidence, interpreter suggestion, review status and separate training rights |
| AuditEvent | actor, scoped operation, revision and timestamp; minimal/private |

Use decimal-safe money and explicit currency precision. Store UTC instants plus IANA timezone for display. Resolve DST ambiguity explicitly. Unique reservation constraints or equivalent transactions prevent double booking.

## 7. Booking state machine and races

States: requested, seeking_match, offer_pending, awaiting_user_acceptance, awaiting_payment, confirmed, in_progress, completed, cancelled, expired, no_show, disputed. Payment/dispute states are separate from service lifecycle; a later dispute does not erase service evidence.

Slot holds expire. Interpreter acceptance and user booking confirmation atomically verify active slot/offer/quote, capacity, scope and current eligibility. Overlapping intervals are rejected, including buffers where configured. Calendar integration is not authority unless actual atomic reservation logic exists.

Every mutation uses expected revision and idempotency. Same key/different payload conflicts. Duplicate callbacks cannot charge twice, double-book or refund twice. Define payment-success-after-hold-expiry reconciliation: never resurrect a conflicted booking; mark reconciliation required and void/refund through authorized policy.

Interpreter suspension before start prevents new access and triggers reassignment/refund workflow. Reassignment requires user's acceptance if qualification, time or price changes. Do not substitute an interpreter silently.

## 8. Pricing, payments and duration

Show a pinned quote before acceptance: currency, estimated total, minimum billable duration, billing increment, taxes/fees, cancellation/no-show terms and optional overrun ceiling. Do not promise a free call or price merely from model-generated estimates.

Manual invoicing / enterprise billing is the live payment path until a verified processor adapter is authorized; payment state is labeled honestly. If integrated, use existing verified payment adapter with authenticated webhooks and reconciliation. No new custody/escrow or payouts until an appropriate operational/legal setup and explicit authorization exist.

Meter actual service intervals using authoritative room/provider events. Define whether waiting, reconnection and interpreter-only attendance are billable in the accepted policy. Browser client timers are not billing authority. Deduplicate intervals, cap overruns and request explicit extension approval before exceeding the quote ceiling; otherwise end or fall back according to notice.

Staff review exceptional adjustments/refunds with audit. Ratings cannot automatically decide a dispute or reduce interpreter compensation. Separate customer charge and interpreter compensation; software completion does not prove payable payout permission.

## 9. Context handoff and product integrations

Preview source artifacts, translated summary and unresolved questions before sharing. Scope consent to selected participants/evidence and the booked interpreter. Respect third-party data and permissions; the requester cannot grant access to material they do not control. If permission is incomplete, share a redacted summary or ask the user to restate the question.

AccessLine: offer scheduled browser help or verified telephone transfer based on actual adapters. Never say an interpreter is joining while only a request exists.

MeetingBridge: invite scoped interpreter with disclosed role; no business-action confirmation authority. VoiceBridge: select exact message revisions; correction notices mark handoff context stale. Everyday: share selected document regions, not every private file. DealBridge: interpretation assists review, but both parties still confirm themselves. Voice Studio/Assurance review work may use qualified reviewers through a separate task scope, not assumed interpreter competence.

Pinned context is historical evidence. Subsequent source correction generates an interpreter notice and revised grant where needed; do not silently swap meaning. Revocation blocks future reads and connections, but cannot erase information already heard/downloaded. Short-lived media URLs and data-retention settings must reflect that limit.

## 10. Session media and confidentiality

Reuse real authenticated browser audio infrastructure with room tokens bound to booking/role/expiry and membership checks. Microphone/headphone checks, text fallback, accessible mute/leave controls and visible interpreter status. No unauthorized recording or automatic voice cloning.

Recording is optional and purpose-specific; disclose live provider processing separately. Transport/storage encryption is not end-to-end encryption if server/provider processing has access. Retain minimum necessary evidence. Private recordings/transcripts are not public portfolio material.

Interpreter access starts within the allowed booking window and ends at completion/expiry unless explicit limited follow-up grant exists. Provide reporting/escalation controls. General interpretation is not an emergency service; unsupported urgent requests should receive honest scope guidance rather than a promised emergency response.

## 11. APIs and events

Illustrative endpoints: POST /relay/requests; GET /relay/coverage; GET /relay/slots; POST /offers/{id}/accept; POST /requests/{id}/quotes/{quoteId}/accept; POST /bookings/{id}/context-grants; POST /bookings/{id}/join; POST /bookings/{id}/cancel; POST /bookings/{id}/extensions; POST /bookings/{id}/feedback; POST /bookings/{id}/disputes.

Admin endpoints handle qualification review, slot/rate management, suspension and reconciliations with explicit RBAC. Validate schemas, ownership, capacity and role on every request. Webhooks use actual provider signature/replay checks.

Events: request.created, offer.accepted/expired, booking.confirmed/cancelled, context.changed/revoked, session.started/ended, usage.finalized, payment.reconciliation_required and dispute.opened. Envelope contains IDs/sequence/revision/time, not raw confidential context. Notifications require configured channel permission and use durable outbox/idempotency; no external sending during unauthorized development.

## 12. Operations, retention and rollout

Dispatcher dashboard: qualified coverage, unmatched requests, slot conflicts, cancellations/no-shows, upcoming sessions, connection failures, disputes and payment reconciliation. Human processes cover recruitment, qualification, confidentiality onboarding, language review, support hours and dispute handling; these cannot be claimed complete from code alone.

Set SLA expectations from staffed availability. No “24/7” or instant coverage without evidence. Track fill rate, time to accepted match, attended sessions, successful handoffs, user-reported resolution, review quality and net margins including interpreter/support/payment costs.

Private encrypted storage, scoped URLs, redacted logs and defined deletion/retention for credential documents, session context and financial records. Delayed jobs cannot resurrect deleted content. Explain backup/export limitations accurately; no silent training on sessions/corrections.

Feature flags per corridor/tenant/domain. Alerts for double-book attempts, unmatched backlog, no-shows, suspension/access errors, spend anomalies and refunds. Rollback stops new bookings while preserving support for confirmed obligations; do not abandon existing customers by hiding their sessions.

## 13. Implementation phases and tests

1. Inspect working services and actual staffing/integration gaps; define one launch corridor and qualification policy.
2. Implement verified profiles, role boundaries, availability, atomic holds/offers and quote snapshots.
3. Add bookings, real billing/manual-invoice state, expiry/cancellation and reconciliation.
4. Build consented context preview/grants and real private session delivery.
5. Integrate originating products with honest coverage/availability and correction notices.
6. Add operations, feedback/disputes, retention, accessibility and operations metrics.

Acceptance tests:

- Two concurrent requests cannot book the same interpreter interval.
- Expired/suspended/unqualified offers cannot become confirmed bookings.
- DST/overlapping intervals and setup buffers are handled correctly.
- Quote changes require fresh user acceptance; overrun ceiling cannot be bypassed.
- Repeated payment/refund callbacks do not duplicate financial effects.
- Late payment after hold expiry enters reconciliation, not conflicted reservation.
- Interpreter receives only granted current/scoped context; unauthorized/cross-tenant assets fail.
- Source corrections flag handoff context; grant revocation blocks new access.
- Interpreter cannot impersonate user or confirm DealBridge/MeetingBridge items.
- Join tokens are expired/scoped; removed users cannot rejoin.
- Client timer tampering does not change billing; no-show/disconnect policies follow accepted terms.
- No availability yields truthful unmatched state, not fictional interpreter connection.
- Cancellation/dispute preserves historical evidence and staff audit.
- Optional recording/training choices are respected; deleted context cannot be restored by jobs.
- Available browser/mobile audio, keyboard and screen-reader flows pass; disclose untested environments.

Deliver code, migrations/indexes/rules, configuration example without secrets, real adapter setup, labeled simulator, qualification/operations checklists, meaningful tests, verification report and rollback runbook. Recruitment, native skill review and payment permissions are explicit human launch prerequisites.

## 14. Launch corridor and definition of done

Launch with scheduled general-domain sessions and a genuinely staffed, reviewed interpreter pool (demo_staffed profiles are labeled and never presented as hired supply). Measure booking completion, attendance, quality complaints, successful context transfer, actual resolution evidence, repeat demand and fully loaded contribution margin. A completed session or high rating does not prove accurate interpretation; use consented qualified quality review.

Done: actual qualified supply is distinguishable from demo profiles; reservations/pricing are race-safe; users grant context access explicitly; real media works; no fictional instant coverage; interpreter authority remains bounded; payment states and unresolved operational prerequisites are documented.

## 15. Cursor build-agent starting script

> Implement Lugemi Relay in the existing repository using this guide. Inspect repository instructions and working auth, scheduling, media, billing and support services first. Start with scheduled general-domain interpretation for one verified corridor. Build qualification-aware profiles, atomic availability holds/offers, transparent pinned quotes, bookings, consented scoped context, private sessions and human-operated disputes/reconciliation. Never invent interpreter availability or qualifications, bypass user acceptance, double-book or let interpreters confirm for customers. Integrate AccessLine, MeetingBridge, Everyday and other modules only through real authorized adapters with honest disabled states where missing. Deliver code, migrations, setup docs, meaningful tests, labeled demo supply, operational prerequisites and verification report. Do not deploy, provision paid resources, recruit/contact interpreters, charge/payout funds or send external messages without separate authorization.
