# @lugemi/cli

Thin command-line client for the Lugemi API (`@lugemi/sdk`).

```bash
pnpm --filter @lugemi/cli build
export LUGEMI_API_KEY=lg_live_...
# or soft sandbox:
export LUGEMI_API_KEY=lg_test_...

lugemi languages
lugemi whoami
lugemi translate --text "Hello" --target sw --source en
```

For video platforms and agent IDEs, use the MCP server:

```bash
pnpm --filter @lugemi/mcp build
LUGEMI_API_KEY=lg_live_... node packages/mcp/dist/index.js
```

Mobile: see `packages/sdk-android` (Kotlin) and `packages/sdk-ios` (Swift) stubs for the same REST surface.

Not a full developer platform CLI. See `docs/DEVELOPER_CLOUD.md`.
