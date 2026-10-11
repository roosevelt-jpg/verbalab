# Lugemi LearnBack — Cursor build-agent script and implementation guide

Version 1.1 | 11 October 2026 | Implemented product specification

## 1. Build mandate

Implement LearnBack inside Lugemi: spoken practice for useful real-world situations, with explanations in the learner's preferred language, meaning-first feedback, validated pronunciation coaching and a personal phrasebook.

Initial product: adult job-interview practice for one verified language pair. Illustrative: Twi explanations and English practice; enable only after checking actual models and content. Later scenarios include customer service, school meetings and workplace conversations. Do not launch all languages/scenarios at once or promise hiring outcomes.

Inspect repository instructions and actual auth, UI, ASR/TTS, translation, educational content, storage, jobs and evaluation services. Reuse working models and components; distinguish usable checkpoints/endpoints from scaffolding. Existing tutor modules should be extended rather than duplicated.

This document authorizes reversible development, not deployment, paid provisioning, external messages or automatic training on recordings. No claim of novelty or proven learning benefit is implied.

## 2. Product journey

1. Learner chooses explanation language/variety, practice language, situation and goal. Accent preference is optional and separate from correctness.
2. Explain microphone processing and retention. Offer text input and accessible text alternatives. Training permission is separate and optional.
3. Play a native-reviewed question, such as “Tell me about a time you solved a problem.” Show text and an optional explanation.
4. Learner records an answer. Provide retry/preview before submission and a visible processing state.
5. ASR produces a transcript with uncertainty. Learner can correct it; uncertain recognition is not scored as a learner error.
6. Evaluate communicative relevance/completeness against a reviewed rubric, then explain one or two useful improvements in the preferred language.
7. Offer an improved example preserving the learner's facts. Label it as an example, not a verbatim translation or factual claim about the learner.
8. Replay, try again, compare attempts and optionally save a useful phrase to the phrasebook.
9. Show practice history and specific evidence of progress, with unassessed dimensions explicit. Schedule optional reminders only through supported permissioned mechanisms.

Never invent achievements, qualifications or work history. Do not submit job applications or communicate with employers. Users can practise fictional scenarios if they explicitly select that mode; label fictional content clearly.

## 3. Pedagogy and content

Use versioned scenario packs authored/reviewed by qualified language educators and native speakers. Each pack includes question, explanation, intent, target skills, follow-up prompts, rubric, example answers, phrase examples and supported varieties. Separate language quality from career advice.

Feedback order: intended meaning → answer organization → relevant language improvement → optional pronunciation. Avoid overwhelming corrections. Provide choices to simplify/repeat feedback or ask why. Beginner level can be self-selected; do not claim a standardized proficiency level without a validated assessment.

Rubrics focus on communication, not preferred cultural personality or accent. Accept multiple truthful answer styles. Do not penalize Ghanaian English or another intelligible variety for differing from American/British norms. Describe a chosen accent target as optional practice, never a measure of intelligence, professionalism or worth.

Adaptive difficulty must be bounded by reviewed scenario rules and learner choice. Motivation/streaks are optional; avoid presenting practice frequency as demonstrated skill improvement.

## 4. Architecture and services

Pipeline: reviewed scenario prompt → real TTS/text → validated recording → ASR → learner transcript correction → meaning/organization rubric evaluation → localized explanation → approved example synthesis → retry/history.

Adapters: ScenarioRepository, SpeechRecognizer, Translator, SpeechSynthesizer, AnswerEvaluator, PronunciationAssessor, FeedbackRenderer and ReminderAdapter. Pin versions and reuse existing pronunciation assets where compatible. Language Assurance may check generated explanations/examples but does not certify learning or pronunciation ability.

Use schema-constrained evaluation with source evidence. User speech is untrusted data and cannot change rubrics, permissions or invoke arbitrary tools. The server manages state and progress; an LLM cannot authorize score promotion, external communication or dataset enrollment.

## 5. Data model

| Entity | Contract |
| --- | --- |
| LearnerProfile | authenticated owner, languages/varieties, optional goal/accent preference, accessibility, privacy settings |
| ScenarioPackRevision | reviewed prompts/examples, rubric version, target skill, languages, level label and reviewer provenance |
| PracticeSession | owner, pack revision, chosen languages, state, retention/policy and timestamps |
| Attempt | session, audio reference/hash, prompt revision, attempt number, state |
| TranscriptRevision | ASR text/model, learner edits, uncertainty and immutable parent revision |
| Evaluation | transcript/audio hashes, rubric/model/calibration versions, evidence-linked findings, unassessed dimensions |
| FeedbackRevision | exact localized explanation/example, evaluation/source references, meaning checks and model version |
| PronunciationFinding | audio span if reliable, target form, assessed feature, limitations/confidence provenance |
| PhrasebookEntryRevision | phrase, intended meaning/context, languages, text/audio revisions, source and review status |
| ProgressObservation | skill/rubric, comparable task evidence, assisted/unassisted status; not an unsupported proficiency certificate |
| Consent/Audit/Usage | processing/training/reminder purpose, operations, costs and restricted metadata |

Audio, transcripts and evaluations are owner-private by default. No public rankings or recruiter access. Text correction invalidates text-based findings; it cannot prove acoustic pronunciation changed. Distinguish edited-text performance from original spoken performance in history.

## 6. Evaluation contract

Return dimensions separately: relevance to question, completeness, organization, grammar where applicable and pronunciation only where validated. Each finding references the learner's actual words and reviewed rubric. Abstain when transcript/audio is unreliable.

Example:

```json
{
  "attemptId": "attempt_id",
  "transcriptRevisionId": "transcript_rev_id",
  "rubricVersion": "interview_v1",
  "status": "feedback_available",
  "findings": [{
    "dimension": "organization",
    "evidence": "I fixed the issue",
    "suggestionIntent": "explain_action_and_result",
    "priority": 1
  }],
  "pronunciation": {"status": "not_assessed", "reason": "No validated assessor for this variety"},
  "unassessedDimensions": ["standardized_proficiency"]
}
```

Do not manufacture a 0–100 score without validated measurement and calibration. Descriptive rubric feedback is the default product contract. If scores are added, validate agreement against educator ratings and report scope/uncertainty. Recognition confidence is not pronunciation accuracy.

Improved examples may reorganize the learner's facts; missing details remain placeholders or clarification questions. Do not replace a modest claim with exaggerated success. Translate feedback naturally while preserving meaning and separating source answer, suggestion and example.

## 7. Pronunciation assessment and accent fairness

Inventory actual assessment models, supported phoneme inventories and language-variety data. Forced alignment provides timing, not proof of correct phonemes or lexical tone. TTS→ASR agreement, text similarity and generic model opinion cannot alone establish pronunciation quality.

Where valid, assess specific comprehensibility-relevant sounds, stress or tone and show a short actionable example. In tonal languages, use native-reviewed contrasts and a task-validated assessor. If unavailable, offer listen-and-repeat/self-comparison plus optional qualified human feedback, labeled unscored.

Use reference voices verified for the selected variety. Do not require a learner to imitate one country's accent for a correct answer. Test false corrections across accents, dialects, recording devices, noise and speech differences. Low signal quality prompts recapture; it must not penalize competence.

Native educators review the teaching content and assessment behavior. Building their review UI is not equivalent to obtaining human validation. Route disputed feedback to review where configured; record correction/adjudication history.

## 8. Personal phrasebook and reminders

Learner explicitly saves a phrase, intended use and explanation, with native audio where supported. Preserve pronunciation/translation revisions. Mark unreviewed user/generated examples appropriately and allow editing/deletion.

Offer retrieval practice: show/hear a cue, let learner attempt, then reveal the example. Suggested spacing is configurable and should not be marketed as guaranteed learning. Track exposure/retries separately from demonstrated transfer to a new task.

Reminders require opt-in, selected timezone/channel, quiet hours and unsubscribe. Use existing permissioned notification infrastructure. If absent, provide an in-app due list; do not secretly provision external messaging or claim reminders are delivered.

## 9. APIs, concurrency and UI

Illustrative endpoints: GET /learnback/scenarios; POST /learnback/sessions; POST /sessions/{id}/attempts/uploads; POST /sessions/{id}/attempts; POST /attempts/{id}/transcript-revisions; GET /attempts/{id}/feedback; POST /learnback/phrasebook; PATCH /phrasebook/{id}; GET /learnback/progress; PATCH /learnback/reminder-preferences; DELETE /sessions/{id}.

Use existing namespaces, schema validation, owner/tenant checks, quotas, idempotency and expected revisions. Duplicate/out-of-order jobs cannot duplicate attempts or publish feedback for superseded transcripts. Each evaluation pins exact input hashes and rubric. Tombstones prevent deleted data being recreated by delayed workers.

Screens: situation/goal chooser, practice player/recorder, transcript review, concise feedback, before/after comparison, phrasebook, progress and privacy. Accessible keyboard/screen-reader controls, text fallback, playback speed and no autoplay. Keep model details in admin diagnostics. Do not make microphone-only access mandatory.

## 10. Privacy, reliability and cost

Use private encrypted media, scoped short-lived URLs and redacted logs. Validate actual audio content, decode safely, cap duration/file size and sandbox processing. Server/provider inference is not end-to-end encryption.

Separate service processing, optional human review, model training and reminders. No automatic training on learner voice. Define retention/deletion for original recordings, edits, evaluations, phrasebook audio, caches and backups. Explain downloaded-copy/backup limitations honestly. Do not clone learner identity by default.

Adult product only; do not assert a compliant children's product without a separately designed consent/privacy model. Avoid sensitive personal data in scenario requests; offer practice with fictional details explicitly.

Meter ASR, translation, evaluation, TTS and retries; configure session/audio/fan-out limits. Optional offline drafts are owner-scoped/time-bounded; clear on logout and never claim offline inference without actual models. Provider failure yields retry/text practice, not fabricated voice/scoring success.

## 11. Implementation phases and acceptance tests

1. Discover existing tutor/speech services and real assessment coverage; produce gap map.
2. Add reviewed scenario packs, owner-private sessions, actual audio capture and transcript correction.
3. Implement evidence-linked descriptive feedback, localized explanations and fact-preserving examples.
4. Add validated pronunciation adapter or honest unscored listen-and-repeat fallback.
5. Build phrasebook, progress observations, opt-in reminder adapter and retention/cost controls.
6. Run native-educator evaluation, mobile/accessibility checks and feature-flagged rollout.

Meaningful tests:

- ASR misrecognition prompts correction rather than penalizing learner skill.
- Unavailable pronunciation model returns not_assessed, not an invented score.
- Intelligible regional accent is not marked wrong solely for nonreference accent.
- Example answer preserves facts; missing achievement/result asks clarification.
- Feedback evidence refers to exact current transcript/rubric.
- Learner edits invalidate stale text feedback without asserting acoustic improvement.
- Prompt injection cannot alter scores/policies or expose other learners' data.
- Retry/duplicate jobs do not duplicate attempts/charges; source deletion cannot be undone.
- No cross-owner/tenant media access; reviewer permissions are scoped.
- Unsupported variety/missing TTS returns truthful capability status.
- Reminder opt-out/timezone/quiet hours work; no external send without permission.
- Available browser/mobile playback, keyboard and screen reader flows pass; disclose untested environments.

Deliver repository code, migrations/indexes/security rules, configuration without secrets, real adapter setup, native-reviewed content workflow, fixtures restricted to test/demo, meaningful tests, labeled demo, evaluation report and operations/rollback instructions. Unobtained human reviews or missing checkpoints remain documented blockers.

## 12. Learning evidence and expansion

Choose one language pair and interview scenario family. Use consented adult learners, educator-reviewed unseen pre/post tasks and a comparison condition where feasible. Evaluate relevance/completeness/intelligibility independently, with blinded raters where practical. Separate coached retry improvement from transfer to a new question.

Measure repeated practice, task performance, disputed/false feedback, completion, accessibility, costs and paid demand. Define sample size and thresholds before analysis; small samples cannot establish general learning benefit. Retention/streaks do not prove proficiency, and language improvement does not guarantee job offers.

Expand only after feedback is trustworthy, accent/variety bias is evaluated and learners demonstrate meaningful task improvement. Product positioning: useful practice with explanations in the learner's language, not automated hiring judgment.

## 13. Cursor build-agent starting script

> Implement LearnBack inside the existing Lugemi repository from this guide. Inspect AGENTS.md, working tutor/speech services, checkpoints and assessment coverage first. Reuse the current stack and start with adult interview practice for one verified language pair. Build reviewed scenario packs, real recording/transcription, learner transcript correction, meaning-first evidence-linked feedback, localized explanations, fact-preserving examples, optional validated pronunciation and a personal phrasebook. Do not confuse ASR confidence with pronunciation or penalize intelligible regional accents. Unsupported assessment must remain unscored and explicit. Pin revisions, reject stale feedback, enforce privacy/deletion and keep reminders opt-in. Deliver code, migrations, setup docs, meaningful tests, labeled demo, native-educator validation workflow and verification report. Proceed with reversible local implementation, but do not deploy, provision paid resources, train on private speech or send external messages without separate authorization.
