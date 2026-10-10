# VoiceBridge verification report

Date: 2026-10-10 · Local reversible work · **Not deployed** without separate authorization.

## Automated

```bash
cd apps/api && pnpm exec vitest run test/voicebridge.spec.ts
```

Expected: 4 passing — illegal transition rejection, content hash, critical-term block, HTTP flow (create → invite → join×2 → draft → publish → 2 variants → stale 409 → correct → FR view shows 15 bags).

## Manual demo (fixtures)

1. Set `VOICEBRIDGE_OPEN=1` and fixture ASR/MT/TTS flags (see RUNBOOK).
2. Open `/voicebridge`, create thread (language `en`).
3. Invite → join as second actor with `fr` + processing consent.
4. Draft text or record → sender review → publish.
5. Confirm FR recipient sees translated variant for the same `sourceRevisionId`.
6. Correct quantity; confirm supersede notice; optional DealBridge draft handoff.

## Acceptance mapping

| Gate | Status |
| --- | --- |
| One message → two language variants same revision | Covered by HTTP test |
| Sender review before publish | Covered |
| Stale correction rejected (409) | Covered |
| Correction reaches active members | Covered (FR view) |
| DealBridge draft only (no receipt rewrite) | Adapter + UI; extend with DealBridge lifecycle when needed |
| Offline reconnect / resumable upload | Not yet |
| a11y / iOS Safari / Android Chrome | Partial labels; device matrix untested here |

## Anamorphic media (adjacent)

Production Deploy `38071498440` succeeded. Verified `https://lugemi.com/brand/media/{products,usecases,platform}/*.jpg` return HTTP 200 for shipped stills.
