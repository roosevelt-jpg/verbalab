# DealBridge operations runbook

## What shipped in software

- Domain tables + migration `20261010140000_dealbridge`
- API under `/v1/dealbridge/*` and admin `/v1/admin/dealbridge/*`
- Console: `/dealbridge`, `/dealbridge/join/[token]`, `/dealbridge/sessions/[id]`, `/admin/dealbridge`
- Simulated investor demo: `POST /v1/dealbridge/demo/run` (always labeled)
- Pilot config, event instrumentation, cohort funnel dashboard, redacted export
- Entitlement: plan feature `dealBridge` (Pro+), overrides, `DEALBRIDGE_OPEN`, `DEALBRIDGE_DISABLED`

## What remains human / model work (not automated by this build)

- Founder-led merchant recruitment and interviews
- Native-reviewed corridor evaluation sets and sample-size planning
- Live ASR/MT/TTS quality certification per corridor (capability gates are explicit)
- Setting production `DEALBRIDGE_RECEIPT_SIGNING_KEY` in a managed secret store
- Adjudicating critical error escape and misunderstanding-related order corrections
- Paid offer design and conversion measurement against real billing events

## Local setup

```bash
docker compose -f infra/docker-compose.yml up -d
cp .env.example .env
# optional for local pilot without Pro plan:
# DEALBRIDGE_OPEN=1
pnpm install
pnpm db:migrate
pnpm --filter @lugemi/api test test/dealbridge.spec.ts
pnpm dev
```

Open `http://127.0.0.1:43125/dealbridge` (or the Studio port).

## Demo reset

```http
POST /v1/dealbridge/demo/reset
{ "sessionId": "..." }
```

Only `isDemo` / `isFixture` sessions may be reset. Labels cannot be removed by a production setting.

## Incident notes

| Symptom | Check |
| --- | --- |
| `feature_disabled` | Plan lacks `dealBridge`, override false, or `DEALBRIDGE_DISABLED=1` |
| `unsupported_corridor` | Only registered corridors in `dealbridge.types.ts` |
| `unsupported_language` | Translation adapter returned unsupported — no silent simulation in prod |
| `check_required` | Explain-back not `check_completed` for that presentation |
| `revision_conflict` | Client used a stale snapshot/presentation after amendment |
| Fixture signing in receipt | Set `DEALBRIDGE_RECEIPT_SIGNING_KEY` |
