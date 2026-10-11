# Language Assurance verification

## Automated

```bash
pnpm --filter @lugemi/api test test/language-assurance.spec.ts
```

Covers:

- Quantity / negation critical findings with evidence
- Equivalent number/currency formats do not false-alarm
- Provider error / truncated audio fails integrity
- Catalog honesty + feature flag
- Preview eligible run + release evidence (idempotent)
- Critical mismatch → needs_clarification
- Independent reviewer self-assign forbidden
- Stale artifact hash rejects review submission
- Voice Studio integration rejects mismatched audio hashes
- Cross-tenant run read returns 404

## Manual console path

1. Sign in (or API key + `X-LanguageAssurance-Actor-Id`).
2. Open `/language-assurance`, create a preview run with a deliberate quantity mismatch.
3. Open the run — confirm findings and disposition.
4. Create a clean preview run, load Markdown report, pin release evidence.
5. For business_audio_v1, assign a different reviewer actor, submit from `/language-assurance/reviews`.

## Explicit non-claims

- Not certified translation or legal approval.
- Matching ASR transcripts do not certify pronunciation.
- Calibration version remains unmeasured until native-adjudicated evals publish.
- Distinct from Language Integrity (watermarks/provenance).
