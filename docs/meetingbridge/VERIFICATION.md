# MeetingBridge verification

## Automated

```bash
pnpm --filter @lugemi/api test test/meetingbridge.spec.ts
```

Covers:

- Illegal meeting/item transitions rejected
- Catalog discloses silence≠consent, media mode, Ghana voices, sync destinations
- Dual-party invite + join with distinct consents
- Phrase utterance + translated captions
- Silence/GET never creates confirmation
- Partial then full confirmation under owners+organizer policy
- Source correction supersedes confirmed dependent items
- Close → minutes → markdown export
- Item amendment (expected revision) reopens review
- Task sync allowlists destinations (rejects unknown); private download works
- Slack/calendar fixture sync writes when integrations fixture mode is on
- Mesh WebRTC token mint + REST offer/answer signaling without SFU URL
- Lobby mic-check, confirmation inbox, organizer diagnostics
- Zoom fixture bot + public caption broadcast token
- Ghana Echo listen-channel TTS for Akan
- Explicit DealBridge + VoiceBridge handoffs
- Cross-tenant meeting read returns 404
- Unsupported corridor returns 400

## Manual console path

1. Sign in (or API key + `X-MeetingBridge-Actor-Id` with `MEETINGBRIDGE_ALLOW_TEST_ACTORS=1`).
2. Open `/meetingbridge`, create a meeting on corridor `en-ak`.
3. Open `/meetingbridge/meetings/[id]/lobby`, run mic check, then enter the room.
4. Mint invite, redeem on `/meetingbridge/join/[token]` as a second actor.
5. Start live, mint media tokens, commit typed turns, propose an action.
6. Open `/inbox` as the required approver; confirm explicitly from both parties.
7. Organizer opens `/diagnostics` for media/integration/Ghana pack status.
8. Close, issue minutes, sync to private download / Slack fixture / calendar ICS.
9. Mint caption broadcast and open `/meetingbridge/broadcast/[token]`.

## Explicit non-claims

- Simultaneous listen-channel TTS still requires `MEETINGBRIDGE_SIMULTANEOUS=1` (mesh alone is not a claim of production simultaneous interpretation quality).
- Ghana neural ASR remains gated by `MEETINGBRIDGE_GHANA_ASR=1` until measured coverage is published.
- Live Zoom/Teams/Slack/email require real credentials; fixture mode is labeled.
- Not legally binding minutes or receipts.
- Not automatic training or voice cloning from participants.
