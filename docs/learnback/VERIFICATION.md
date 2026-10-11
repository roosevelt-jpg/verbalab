# Lugemi LearnBack — verification

## Automated

```bash
cd apps/api && pnpm test -- test/learnback.spec.ts
```

Coverage includes:

- Uncertain ASR abstains instead of scoring learner skill
- Improved examples preserve learner facts (no invented achievements)
- Prompt-injection text does not elevate permissions
- Catalog has no MVP/TODO stubs
- Idempotent attempts do not duplicate charges/rows
- Transcript correction invalidates stale text feedback
- Pronunciation returns `not_assessed` without validated assessor
- External reminders rejected when notifications are not provisioned
- Cross-owner session access returns 404
- Session delete tombstones further reads

## Manual console

1. Open `/learnback` with Clerk session or API key + actor id.
2. Start `ak-en-interview` / job interview session.
3. Hear question (or rely on text if TTS unsupported).
4. Submit a short text answer → receive descriptive feedback.
5. Correct transcript → feedback refreshes; pronunciation not reclaimed as improved.
6. Save phrase → appears under `/learnback/phrasebook` with reveal practice.
7. Check `/learnback/progress` observations and set in-app reminders.
8. Delete session → history no longer lists it.

## Honesty checks

- No hiring outcome claims in UI or catalog.
- Ghanaian English / regional variety not marked wrong solely for accent.
- Fictional mode labeled when selected.
- Adult practice product disclaimer present in catalog limitations.
