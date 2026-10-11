# MeetingBridge operations runbook

## What shipped

- Domain tables + migration `20261011030000_meetingbridge`
- API under `/v1/meetingbridge/*` including media signaling, conferencing bots, sync destinations, lobby mic-check, confirmation inbox, admin diagnostics, and public caption broadcast
- Console: `/meetingbridge`, join, room, `/lobby`, `/inbox`, `/diagnostics`, `/broadcast/[token]`
- SDKs: TypeScript `client.meetingBridge`, Android `MeetingBridgeClient`, iOS `MeetingBridgeClient`
- Entitlement: plan feature `meetingBridge` (Pro+), overrides, `MEETINGBRIDGE_OPEN`, `MEETINGBRIDGE_DISABLED`
- Ghana Echo voice pack for every language in `GHANA_LANGUAGE_STACK` (ASR quality-gated)
- ADR-0257

## Capability honesty

| Capability | Status |
| --- | --- |
| Authenticated rooms, invites, memberships | Shipped |
| Turn-taking phrase captions + translation | Shipped (adapter-backed; fixture MT only in test / `MEETINGBRIDGE_ALLOW_FIXTURE_MT=1`) |
| Explicit item confirmations + minutes/exports | Shipped |
| Mesh WebRTC + REST signaling | Shipped by default without `MEETINGBRIDGE_MEDIA_URL` |
| SFU / LiveKit tokens | Requires `MEETINGBRIDGE_MEDIA_URL` (+ LiveKit keys when minting JWT grants) |
| Simultaneous listen-channel TTS | Gated by `MEETINGBRIDGE_SIMULTANEOUS=1` plus corridor TTS |
| Zoom/Teams bots, public caption broadcast | Shipped behind credentials or `MEETINGBRIDGE_ALLOW_FIXTURE_INTEGRATIONS=1` / `MEETINGBRIDGE_BROADCAST_ENABLED=1` |
| Slack / email / calendar sync writes | Shipped on allowlisted destinations when credentials (or fixture mode) are present |
| Ghana Echo TTS pack | Shipped (neural claim only when `OWN_TTS_URL` is set) |
| Ghana neural ASR | Gated by `MEETINGBRIDGE_GHANA_ASR=1` until measured |

## Local setup

```bash
docker compose -f infra/docker-compose.yml up -d
cp .env.example .env
# optional without Pro plan:
# MEETINGBRIDGE_OPEN=1
# MEETINGBRIDGE_ALLOW_FIXTURE_MT=1
# MEETINGBRIDGE_ALLOW_FIXTURE_INTEGRATIONS=1
pnpm install
pnpm db:migrate
pnpm --filter @lugemi/api test test/meetingbridge.spec.ts
pnpm dev
```

Open `/meetingbridge` on the Studio port.

## Incident notes

| Symptom | Check |
| --- | --- |
| `feature_disabled` | Plan lacks `meetingBridge`, override false, or `MEETINGBRIDGE_DISABLED=1` |
| `unsupported_corridor` | Only corridors in `meetingbridge.types.ts` |
| `invite_expired` / `invite_used` | Mint a fresh invite |
| `conflict` on confirm | Item revision stale after transcript correction — propose/review again |
| Captions-only only | Set mesh on (default) or `MEETINGBRIDGE_MEDIA_URL`; enable `MEETINGBRIDGE_SIMULTANEOUS=1` for listen-channel TTS |
| `unsupported_destination` | Sync allows `private_download`, `internal_queue`, `slack`, `email`, `calendar` |
| `integration_disabled` | Missing Slack/Resend/Zoom/Teams credentials and fixture integrations not enabled |
| Handoff 403/422 | DealBridge/VoiceBridge entitlement or corridor mismatch |

## Rollback

1. Set `MEETINGBRIDGE_DISABLED=1` (kill switch).
2. Optionally remove `meetingBridge` from plan features / set `featureOverrides.meetingBridge=false`.
3. Migration remains reversible via Prisma migrate down for the MeetingBridge migration only when no production data depends on it.
