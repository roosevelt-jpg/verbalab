# @lugemi/mcp

MCP server for **video generation platforms**, agent runtimes, and IDE copilots to call Lugemi speech + translate.

## Tools

| Tool | Purpose |
| --- | --- |
| `lugemi_speech_synthesize` | TTS for scripts (`own:*` voices preferred) |
| `lugemi_translate` | Translate source → target |
| `lugemi_languages_list` | Workspace language catalog |

## Run

```bash
export LUGEMI_API_KEY=lg_live_...
export LUGEMI_BASE_URL=https://api.lugemi.com   # optional
pnpm --filter @lugemi/mcp build
pnpm --filter @lugemi/mcp start
```

Wire into Claude Desktop / Cursor MCP config as a stdio server pointing at `packages/mcp/dist/index.js`.
