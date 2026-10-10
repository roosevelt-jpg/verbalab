# @lugemi/cli

Command-line client for the Lugemi API (`@lugemi/sdk`) — including **video/content voice** pipelines.

```bash
pnpm --filter @lugemi/cli build
export LUGEMI_API_KEY=lg_live_...
# or soft sandbox:
export LUGEMI_API_KEY=lg_test_...

lugemi languages
lugemi voices
lugemi whoami
lugemi translate --text "Hello" --target ak --source en
lugemi speech --text "Akwaaba" --voice own:ak-gh-female --language ak --out line.mp3
lugemi video-voice --text "Welcome" --source en --target ak --voice own:ak-gh-female --out dub.mp3
```

## MCP (agent IDEs)

```bash
pnpm --filter @lugemi/mcp build
LUGEMI_API_KEY=lg_live_... node packages/mcp/dist/index.js
```

Hosted: `POST https://api.lugemi.com/v1/mcp` with Bearer `lg_live_…`. See `docs/mcp.md` and `/mcp`.

## Mobile

- Android (Kotlin): `packages/sdk-android`
- iOS (Swift): `packages/sdk-ios`

Same REST surface: speech, translate, detect, ASR (`transcribe` / `recognizeSpeech`), streaming translate,
voices, languages, `videoVoiceLine`, plus VoiceBridge and DealBridge clients with resumable media uploads.

See `/developers` in the console and `docs/DEVELOPER_CLOUD.md`.
