# VoiceBridge runbook

## Feature flag

- Plan entitlement: `voiceBridge` (Pro+ by default)
- Org override: `featureOverrides.voiceBridge`
- Pilot open: `VOICEBRIDGE_OPEN=1`
- Kill switch: `VOICEBRIDGE_DISABLED=1`

## Local fixtures

```
VOICEBRIDGE_OPEN=1
VOICEBRIDGE_ALLOW_TEST_ACTORS=1
VOICEBRIDGE_ALLOW_FIXTURE_ASR=1
VOICEBRIDGE_ALLOW_FIXTURE_MT=1
VOICEBRIDGE_ALLOW_FIXTURE_TTS=1
```

## Alerts to wire

- Queue / processing job age (`voice_processing_jobs.status=queued|running`)
- Dead letters (`status=dead_letter`)
- Generation errors (`processing.failed` events)
- Correction propagation failures (job `stale` after correction)
- Unexpected fan-out cost (`cost_usd_micros` spikes)
- Deletion failures (tombstone vs late worker)

## Rollback

1. Set `VOICEBRIDGE_DISABLED=1` (or plan override false).
2. Leave durable jobs; stale-revision guards prevent superseded content from becoming current.
3. Do not drop tables without a retention/export review.

## Demo path

1. `POST /v1/voicebridge/threads` with creator language `en`
2. Create invite → second actor joins with `fr` + processing consent
3. Draft text message → sender review → publish
4. Confirm two language groups produce variants for the same `sourceRevisionId`
5. Correct with `expectedActiveRevisionId` → old revision superseded; recipients see notice
6. Optional: `POST .../deal-drafts` creates a DealBridge draft only (not a receipt)
