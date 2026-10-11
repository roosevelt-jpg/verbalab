# MeetingBridge operations runbook

## What shipped

- Domain tables + migration `20261011030000_meetingbridge`
- API under `/v1/meetingbridge/*`
- Console: `/meetingbridge`, `/meetingbridge/join/[token]`, `/meetingbridge/meetings/[id]`
- SDKs: TypeScript `client.meetingBridge`, Android `MeetingBridgeClient`, iOS `MeetingBridgeClient`
- Entitlement: plan feature `meetingBridge` (Pro+), overrides, `MEETINGBRIDGE_OPEN`, `MEETINGBRIDGE_DISABLED`
- ADR-0257

## Capability honesty

| Capability | Status |
| --- | --- |
| Authenticated rooms, invites, memberships | Shipped |
| Turn-taking phrase captions + translation | Shipped (adapter-backed; fixture MT only in test / `MEETINGBRIDGE_ALLOW_FIXTURE_MT=1`) |
| Explicit item confirmations + minutes/exports | Shipped |
| WebRTC / SFU simultaneous interpretation | Requires `MEETINGBRIDGE_MEDIA_URL` and corridor quality gates — not simulated |
| Zoom/Teams bots, public broadcast, auto task sync | Out of scope |

## Local setup

```bash
docker compose -f infra/docker-compose.yml up -d
cp .env.example .env
# optional without Pro plan:
# MEETINGBRIDGE_OPEN=1
# MEETINGBRIDGE_ALLOW_FIXTURE_MT=1
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
| Captions-only only | Expected without `MEETINGBRIDGE_MEDIA_URL` |

## Rollback

1. Set `MEETINGBRIDGE_DISABLED=1` (kill switch).
2. Optionally remove `meetingBridge` from plan features / set `featureOverrides.meetingBridge=false`.
3. Migration remains reversible via Prisma migrate down for the MeetingBridge migration only when no production data depends on it.
