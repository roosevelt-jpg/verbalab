# Lugemi LearnBack — operations runbook

## Surface

- API: `/v1/learnback/*`
- Web: `/learnback`, `/learnback/scenarios`, `/learnback/sessions/:id`, `/learnback/phrasebook`, `/learnback/progress`
- SDK: TypeScript `client.learnBack`
- Entitlement: plan feature `learnBack` (Pro+), org `featureOverrides.learnBack`, `LEARNBACK_OPEN`, `LEARNBACK_DISABLED`

## Environment

| Variable | Purpose |
| --- | --- |
| `LEARNBACK_DISABLED=1` | Kill switch |
| `LEARNBACK_OPEN=1` | Bypass plan entitlement (local/demo) |
| `LEARNBACK_ALLOW_TEST_ACTORS=1` | Allow `X-LearnBack-Actor-Id` without Clerk |
| `LEARNBACK_ALLOW_FIXTURE_ASR=1` | Fixture ASR when speech adapter fails |
| `LEARNBACK_ALLOW_FIXTURE_TTS=1` | Fixture WAV when TTS unavailable |
| `LEARNBACK_ALLOW_FIXTURE_MT=1` | Fixture localization when MT fails |
| `LEARNBACK_PRONUNCIATION=1` | Enable pronunciation assessor when available |
| `LEARNBACK_FIXTURE_ASR_TEXT` | Override fixture transcript |
| `LEARNBACK_MAX_AUDIO_BYTES` | Default 15 MB |
| `LEARNBACK_MAX_AUDIO_SECONDS` | Default 120 |
| `NOTIFICATIONS_DISABLED=1` | Force in-app reminders only (default honest path) |
| `DOCUMENT_STORAGE_DIR` | Private audio root (shared with Documents/Everyday) |

## Adapter stack

1. Reviewed scenario packs seeded on boot (`SYSTEM_SCENARIO_SEEDS`)
2. Capture audio or accessible text answer (microphone never mandatory)
3. ASR via `AudioService.transcribe` (fixtures only when allowed)
4. Evidence-linked descriptive rubric evaluation — no fabricated 0–100 scores
5. Localized feedback via `TranslateService`; unsupported stays English source
6. Pronunciation stays `not_assessed` unless `LEARNBACK_PRONUNCIATION=1` and assessor succeeds
7. Phrasebook + progress observations + opt-in in-app reminders

## Common errors

| Code | Meaning |
| --- | --- |
| `feature_disabled` | Plan lacks `learnBack`, override false, or kill switch |
| `actor_required` | Missing Clerk user / actor header |
| `unsupported_corridor` / `unsupported_situation` | Corridor/situation mismatch |
| `scenario_unavailable` | No reviewed pack for corridor/situation |
| `asr_unavailable` | Speech recognition failed and no text fallback |
| `revision_conflict` | Stale `expectedTranscriptRevisionId` |
| `reminders_in_app_only` | External channel requested without notifications |
| `audio_unavailable` | TTS unsupported or missing artifact |

## Rollback

1. Set `LEARNBACK_DISABLED=1` and redeploy API.
2. Optionally set `featureOverrides.learnBack=false` on affected orgs.
3. Web routes remain but API returns 403.

## Privacy

- Sessions, audio, transcripts, and evaluations are owner-scoped inside the organization.
- Delete tombstones sessions and unlinks storage keys; downloaded copies cannot be recalled.
- Training consent is optional and off by default.
- Cross-owner session lookups return `not_found` (no existence leak).
