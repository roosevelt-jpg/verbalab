# Lugemi Language Assurance — Cursor build guide

Version 1.0 | 11 October 2026 | Proposed engineering specification

## 1. Objective and mandate

Build a shared quality-control service that checks source meaning, translated text and generated speech before the configured business workflow releases them. Detect critical discrepancies, represent uncertainty, route cases to qualified native reviewers, and produce version-bound evidence reports.

Integrate with actual Lugemi services and the existing Fidelity/error-verification model if available. Do not build another parallel translation platform. Inspect AGENTS.md, repository structure, usable model checkpoints/endpoints, authentication, tenant isolation, media infrastructure, review tools, policies and tests before implementation. Reuse the current stack and verified adapters.

This service supplies checks and workflow evidence, not a guarantee of correctness, legal certification or proof of comprehension. Do not label a machine result as native-speaker approval or claim competitive superiority without evaluation.

## 2. Initial scope

MVP: asynchronous verification for Voice Studio scripts/translations/audio, deterministic critical-field checks, audio integrity checks, optional independent ASR comparison, semantic Fidelity adapter, native review queue, explicit release gates and private evidence exports.

Start with one verified language corridor and defined business content category. Extend to VoiceBridge/DealBridge and live AccessLine/MeetingBridge only through task-specific policies after evaluation. A batch review service cannot be described as a low-latency live guarantee.

Do not make model training, an external marketplace or a new general LLM prerequisites. Unsupported checks remain explicit. Reuse existing reviewers and model assets wherever validated; missing checkpoints/credentials are documented blockers rather than fixture-backed success.

## 3. Evidence inputs and provenance

Verification request must pin immutable artifacts: source text/revision, source audio/hash if relevant, translated text/revision, synthesized audio/hash, source/target language variety, production model/voice versions, terminology/pronunciation snapshot, originating product, content category and policy snapshot.

Tenant/user authorization is derived server-side. Private media references resolve only through authorized internal storage, not arbitrary caller URLs. Reject mismatched ownership, invalid content types, oversized/undecodable audio and incomplete artifact references. A report applies only to its exact input hashes; it cannot approve a newer artifact implicitly.

Distinguish checks of translation text, speech realization of approved target text, and source-ASR accuracy. Correct synthesis of an already mistranslated script does not establish correct translation. If source transcript is uncertain, preserve that uncertainty in downstream findings.

## 4. Verification stages

### 4.1 Structural and audio integrity

Validate schemas, language capability, decoding, codec/header/sample-rate/channel consistency, duration and truncated output. Measure clipping, unexpected silence, repeated fragments and suspicious tone-only output using calibrated heuristics. Provider errors must never be processed as valid audio. Beeps or echo flagged by signal checks require investigation; heuristics are not pronunciation judgments.

### 4.2 Critical information checks

Extract source/target names, quantities, currencies, units, dates, negations, conditions and obligations with exact evidence spans. Normalize through language-specific rules while retaining written forms and diacritics. Use decimal arithmetic, explicit currencies, supported unit mappings and timezone-qualified dates.

Ambiguous local units, pronouns, relative dates and amount formats trigger uncertainty/clarification. Do not invent a conversion or replace unknown with zero. Compare meaning rather than raw strings: different date/number surface formats may be equivalent. Critical extractors can fail; validate them independently and include unknown extraction states.

### 4.3 Semantic Fidelity

Invoke the existing verified error detector or a constrained adapter for omissions, additions, altered obligation, polarity and referent changes. Require source/target evidence and categorized findings. Reject malformed responses. Treat all source content and embedded instructions as untrusted data; they cannot change policies, approvals or tool permissions.

Prefer a verifier with meaningful independence from generation where feasible. Document shared model families/training dependencies. Back-translation or a generator grading itself is insufficient evidence alone. Scores become error probabilities only after task/corridor calibration.

### 4.4 Spoken realization

Where independent ASR supports the target variety, transcribe synthesized audio and align against approved target text. Identify omissions, repetitions and changed critical values with timestamps when reliable alignment exists. Do not invent timestamps or phoneme-level accuracy from word alignment.

ASR can share errors with TTS or fail on tone/dialect; matching transcripts do not prove natural pronunciation or meaning. Lexical tone, naturalness, accent authenticity and prosody need qualified human review or specifically validated specialized checks. If independent ASR is unavailable, report the check unavailable; do not silently pass it.

## 5. Policy engine and release gates

Use deterministic server-side policy evaluation. A model cannot issue release approval, waive a required check or impersonate a reviewer. Policy defines content/task/corridor, required stages, severity rules, calibrated thresholds, human-review requirements, permitted retry count and latency/cost budget.

Separate execution state from disposition:

- Execution: queued, running, completed, failed, cancelled, stale.
- Disposition: eligible_under_policy, needs_clarification, human_review_required, blocked, indeterminate.

Eligible means configured checks completed and passed for these artifacts; it does not mean guaranteed correct. An unavailable required stage yields indeterminate/blocked according to policy, never pass. Policy-controlled retries generate new artifacts and verification runs rather than overwriting failed evidence.

Suggested initial policies: business batch audio requires all integrity/critical checks and native review; lower-risk preview may be generated but labeled unreviewed; live workflows use a bounded automated subset plus explicit clarification/human fallback. Do not impose asynchronous review mid-call without a workable user path.

Authorized policy changes create versioned snapshots. An owner cannot weaken an active item's policy retrospectively without a visible new review/release revision. Any exceptional override requires a designated authorized human, explicit reason and audit; MVP may disable overrides entirely.

## 6. Domain entities

| Entity | Required contract |
| --- | --- |
| ArtifactBundle | tenant/product references, immutable input revisions/hashes, languages/varieties and provenance |
| VerificationRun | bundle, policy/calibration/model versions, stage states, timestamps, idempotency key and disposition |
| CheckFinding | stage, category, severity, source/target spans, audio timestamps if supported, uncertainty and evidence |
| PolicySnapshot | required checks/review roles, thresholds, task/corridor, budget and version |
| CalibrationSnapshot | dataset/split identifiers, task/corridor, score mapping, coverage/risk results and validity limits |
| ReviewAssignment | language/variety qualification, target artifacts/run, reviewer, status and access scope |
| HumanReview | artifact hashes, findings, judgment, correction suggestions, reviewer and adjudication history |
| ReleaseEvidence | exact bundle/run/report hash, policy decision, human approvals and timestamp |
| Audit/Usage | operations, retry/model costs and minimal metadata; restricted access |

Example result:

```json
{
  "runId": "run_id",
  "artifactBundleHash": "bundle_hash",
  "policyVersion": "business_audio_v1",
  "executionState": "completed",
  "disposition": "blocked",
  "findings": [{
    "category": "quantity_mismatch",
    "severity": "critical",
    "sourceEvidence": "15 boxes",
    "targetEvidence": "50 boxes",
    "stage": "critical_information",
    "scoreMeaning": "uncalibrated_detector_score"
  }],
  "unavailableChecks": [],
  "requiresHumanReview": true
}
```

Do not embed sensitive evidence spans in generic telemetry. API response access is tenant/product-authorized; exported reports can redact content separately from internal adjudication.

## 7. Native review workflow

Reuse Voice Studio review components if implemented. Assign reviewers qualified for the actual language variety/task. Show source evidence, approved text, translated output, audio and machine findings. Capture independent meaning, pronunciation, lexical-tone, naturalness and audio-integrity judgments, timestamped corrections and uncertainty.

Separate translation review from speech review; a reviewer must be qualified for source/target meaning or receive appropriately qualified collaboration. Resolve disagreement through adjudication, not majority voting without evidence. Producer cannot self-approve where policy requires independence. A stale artifact hash rejects review submission.

Machine findings support reviewers; they do not substitute for their judgment. Reviewer corrections become new artifact revisions requiring re-verification. Optional training rights are separate from permission to process/review; only licensed/consented approved datasets enter controlled training releases.

## 8. Product integrations

| Product | Integration contract |
| --- | --- |
| Voice Studio | Verify each take/translation and full assembly as policy requires; export pins an eligible reviewed release |
| VoiceBridge | Check recipient variants; unresolved critical discrepancy blocks spoken variant and requests clarification; source corrections invalidate relevant evidence |
| DealBridge | Verify source/terms/review presentations; assurance eligibility never substitutes for two-party confirmation |
| AccessLine | Bounded checks on critical facts; timeouts invoke honest clarification/fallback, not fabricated speech |
| MeetingBridge | Check committed translations and proposed actions; corrections invalidate dependent item reviews, not historical minutes |

Host product remains authority over its lifecycle and confirmations. Integrate through adapter contracts/events, not direct uncontrolled database mutations. Assurance results are consumed only if input hashes/policy version remain current.

## 9. APIs and concurrency

Illustrative endpoints: POST /assurance/runs; GET /runs/{id}; POST /runs/{id}/cancel; GET /runs/{id}/report; POST /reviews/{id}/submit; POST /policies for authorized version creation; POST /runs/{id}/release-evidence for an authorized policy decision. Follow existing namespaces/auth/error envelopes.

POST run input is artifact references plus declared task; server chooses applicable policy and capabilities. Support idempotency, validation, quotas and deduplication within authorized tenant boundaries. Same key/different input conflicts. No shared private-content caches across tenants.

Events: run.started/completed/failed/stale, review.required/completed, artifact.reverification_required and release_evidence.ready. Include event ID, sequence, tenant/product reference, artifact hashes and policy version; avoid private payloads. Consumers deduplicate and recheck current inputs.

Source/model/voice/terminology/selected-audio edits invalidate relevant eligibility. Use dependency indexes and transactional outbox. Late workers/reviews retain historical results but cannot approve current assets. At-least-once jobs are idempotent; do not claim exactly-once network delivery. Deletion tombstones prevent late workers recreating removed artifacts.

## 10. Evidence reports and limits

Private JSON and Markdown reports list exact input provenance, executed/unavailable checks, categorized findings, policy version, calibration limits, native reviews, release disposition and residual uncertainty. Distinguish automated check from human approval. Hash or optional existing signing infrastructure establishes report integrity, not factual correctness.

Report language: “Eligible under policy X for artifacts Y following listed checks.” Avoid “certified translation,” “100% accurate,” or unqualified “safe.” Host workflow must clearly distinguish unreviewed preview, reviewed output and user confirmation.

## 11. Evaluation and calibration

Use independent native-adjudicated datasets with real natural errors plus deliberately perturbed examples: 15/50, missing negation, wrong currency, changed deadline, local unit ambiguity, names, conditions, repeated/omitted speech, tone contrasts and code switching. Seeded failures never enter live customer transactions.

Split by speaker/project/session/business to avoid leakage. Separate training, tuning, calibration and blind tests. Measure critical-error recall, false alarms, accepted-output error rate, review burden, coverage, latency/cost and subgroup/variety performance. Report confidence intervals and clustered sampling; declare denominators and unavailable stages.

Risk-versus-coverage curves evaluate how many outputs can be accepted at a given observed error rate. Never treat high rejection as success without showing coverage. Calibration validity is limited to tested task/corridor distributions; monitor drift and disable stale numeric confidence claims.

Set pilot thresholds before measuring; do not invent achieved metrics. Compare against current Lugemi workflow and individual checks to identify actual benefit. Maintain a blind regression suite and model/policy rollback. Human review quality also needs agreement/adjudication monitoring.

## 12. Security, retention and costs

Tenant isolation and product membership apply to runs, findings, audio and reviewer access. Qualified reviewer assignment grants scoped temporary access, not broad tenant browsing. Private media, short-lived URLs, redacted logs and bounded sandboxed decoding. No arbitrary URL fetches or model-driven policy mutation.

Separate training opt-in, review permissions and retention. Server/provider processing is not end-to-end encryption. Implement deletion propagation for artifacts, reports, derived caches and backups under actual policy; historical immutability does not override deletion rights. Explain exported-copy and trained-weight limitations accurately.

Meter stage/provider retries and reviewer cost. Use bounded retries, batch quotas and timeouts. Alerts: missing required stage, stale calibration, discrepancy spikes, review backlog, cost anomalies, source mismatch and deletion failures. A provider outage cannot silently downgrade mandatory assurance.

## 13. Build phases and acceptance tests

1. Inventory repository/Fidelity/review tools; map actual coverage and dependency gaps.
2. Implement immutable bundles, policies, deterministic release decisions, authorization, jobs and invalidation.
3. Add audio integrity and deterministic critical-information checks with real fixtures.
4. Integrate verified semantic/ASR adapters, qualification-aware native review and correction re-verification.
5. Integrate Voice Studio first, then other products through policy-specific adapters.
6. Add private reports, calibration/evaluation tooling, costs, alerts and tenant/corridor rollout flags.

Acceptance cases:

- Changed quantity/currency/negation triggers evidence-backed critical finding.
- Equivalent number/date formats do not automatically trigger false mismatch.
- Unsupported ASR or failed verifier cannot pass a required stage.
- Matching TTS→ASR transcripts do not auto-certify pronunciation.
- Beep/error JSON/corrupt audio fails integrity checks.
- Source uncertainty remains visible downstream.
- Prompt injection cannot grant approval or fetch external media.
- Wrong hash/revision rejects review/release; late jobs cannot approve changed output.
- Duplicate jobs/events do not duplicate approvals/customer charges.
- Independent reviewer policy is enforced; qualifications and disagreements persist.
- Approved export pins exact reviewed assets and policy.
- Live timeout follows fallback rather than hanging or releasing unverified critical speech.
- Cross-tenant/report/media access fails; deletion cannot be undone by queued work.

Deliver working repository code, migrations/indexes/rules, config example without secrets, real adapter setup, native-review instructions, deterministic tests, labeled demo, evaluation/calibration report and operational runbook. Missing credentials/native evaluations stay documented blockers. Tests prove software properties; they do not certify universal language quality.

## 14. Pilot and commercial evidence

Pilot business announcements in one corridor. Compare with current review workflow on equivalent content. Track critical errors reaching approved output, time to approval, review cost, rework, repeat users and actual willingness to pay. Report unsupported outputs and rejected volume alongside accepted quality. Keep staff/demo traffic separate.

Expand only after credible accuracy/coverage, manageable review burden and costs. A developer API can follow reliable internal integrations; do not promise continent-wide assurance from one pilot.

## 15. Cursor starting prompt

> Build Lugemi Language Assurance from this guide using our existing repository and Fidelity/model assets. Inspect instructions, working services and native-review tools first. Implement exact-artifact verification, deterministic policy gates, critical meaning checks, audio integrity, independently evaluated speech comparison where supported, native-review routing and private evidence reports. Keep unavailable checks and uncertainty explicit. Never let an LLM approve release or replace participant consent/confirmation. Integrate Voice Studio first with stale-artifact invalidation, then use task-specific adapters for the other modules. Deliver code, migrations, setup docs, meaningful tests, labeled demo, calibration/evaluation tools and verification report. Do not deploy, provision paid resources or send external messages without separate authorization.
