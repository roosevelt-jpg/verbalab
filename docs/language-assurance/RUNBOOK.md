# Language Assurance operations runbook

## What shipped

- Domain tables + migration `20261011040000_language_assurance`
- API under `/v1/language-assurance/*`
- Console: `/language-assurance`, `/language-assurance/runs/[id]`, `/language-assurance/reviews`
- SDK: TypeScript `client.languageAssurance`
- Entitlement: plan feature `languageAssurance` (Pro+), overrides, `LANGUAGE_ASSURANCE_OPEN`, `LANGUAGE_ASSURANCE_DISABLED`
- Voice Studio integration: `POST /v1/language-assurance/integrations/voice-studio`
- Guide: `docs/language-assurance/LUGEMI_LANGUAGE_ASSURANCE_CURSOR_BUILD_GUIDE.md`

## Capability honesty

| Capability | Status |
| --- | --- |
| Immutable artifact bundles + hash pinning | Shipped |
| Deterministic critical-field checks | Shipped |
| Audio integrity heuristics | Shipped |
| Semantic Fidelity adapter | Shipped (local/demo calibrator via Fidelity) |
| Spoken realization ASR | Gated (`LANGUAGE_ASSURANCE_SPOKEN_ASR=1`) |
| Native review queue + independent reviewer rule | Shipped |
| Private JSON/Markdown reports + release evidence | Shipped |
| Live AccessLine guarantee | Out of scope for this async service |

## Local setup

```bash
pnpm db:migrate
# optional without Pro plan:
# LANGUAGE_ASSURANCE_OPEN=1
# LANGUAGE_ASSURANCE_ALLOW_TEST_ACTORS=1
pnpm --filter @lugemi/api test test/language-assurance.spec.ts
pnpm dev
```

Open `/language-assurance` on the Studio port.

## Incident notes

| Symptom | Check |
| --- | --- |
| `feature_disabled` | Plan lacks `languageAssurance`, override false, or kill switch |
| `stale_artifact` | Review hashes must match current bundle |
| `idempotency_conflict` | Same key with different source/target hashes |
| Disposition `indeterminate` | Required stage unavailable (often spoken ASR gated) |
| Release 409 | Disposition not `eligible_under_policy` or missing native approve |

## Rollback

1. Set `LANGUAGE_ASSURANCE_DISABLED=1`.
2. Optionally set `featureOverrides.languageAssurance=false`.
