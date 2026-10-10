# ADR-0075: Pronunciation Intelligence (alignment + heuristics)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-156 (library “Phase 22 Pronunciation Intelligence” mapped)

## Context

Library Phase 22 asks for language learning, pronunciation assessment/scoring, accent coaching, phoneme detection, word stress, sentence fluency, plus engine/REST/SDK/dashboard/analytics/monitoring/production.

True phoneme forced alignment and commercial pronunciation tutors (ELSA, SpeechAce, Azure Pronunciation Assessment) require specialized ASR models. Lugemi already has Whisper STT, Accent Intelligence cues, Audio Intelligence PCM metrics, and a linguistic rule registry.

## Decision

1. Ship **Pronunciation Intelligence** under `/v1/pronunciation/*`.
2. **Assess/score:** word-level alignment of reference vs hypothesis or audio→STT; overall/accuracy/fluency/stress components.
3. **Fluency:** speaking rate + silence ratio from PCM (and optional STT duration).
4. **Phonemes / stress:** small dictionary + grapheme heuristics; EN first-syllable / SW penultimate defaults — not timed alignment.
5. **Coaching:** language tip packs + mismatch-driven tips; cross-link Accent Intelligence for spoken accent cues.
6. **Forced alignment:** deferred.
7. Surfaces: engine, analytics, SSE assess stream, GraphQL, SDK/CLI, `/pronunciation-intelligence`, OpenAPI, Speech Cloud catalog `partial`.

## Consequences

- Speech Cloud gains a language-learning assessment loop without false vendor parity.
- Forced-alignment or vendor pronunciation APIs can later replace heuristics behind the same routes.
