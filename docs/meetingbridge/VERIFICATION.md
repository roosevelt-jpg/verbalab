# MeetingBridge verification

## Automated

```bash
pnpm --filter @lugemi/api test test/meetingbridge.spec.ts
```

Covers:

- Illegal meeting/item transitions rejected
- Catalog discloses silence≠consent and media mode
- Dual-party invite + join with distinct consents
- Phrase utterance + translated captions
- Silence/GET never creates confirmation
- Partial then full confirmation under owners+organizer policy
- Source correction supersedes confirmed dependent items
- Close → minutes → markdown export
- Item amendment (expected revision) reopens review
- Task sync allowlists destinations (rejects Slack); private download works
- Explicit DealBridge + VoiceBridge handoffs
- Cross-tenant meeting read returns 404
- Unsupported corridor returns 400

## Manual console path

1. Sign in (or API key + `X-MeetingBridge-Actor-Id` with `MEETINGBRIDGE_ALLOW_TEST_ACTORS=1`).
2. Open `/meetingbridge`, create a meeting on corridor `en-ak`.
3. Open lobby, mint invite, redeem on `/meetingbridge/join/[token]` as a second actor.
4. Start live, commit typed turns, propose an action, confirm from both required approvers.
5. Correct a source turn; confirm the prior action is superseded / stale.
6. Close, issue minutes, export Markdown/JSON/CSV.

## Explicit non-claims

- Not simultaneous interpretation without provisioned media.
- Not legally binding minutes or receipts.
- Not automatic training or voice cloning from participants.
