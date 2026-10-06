# @lugemi/mcp

MCP server for **video generation platforms**, agent runtimes, and IDE copilots to call Lugemi speech + translate for content production.

## Tools

| Tool | Purpose |
| --- | --- |
| `lugemi_speech_synthesize` | TTS for scripts (`own:*` voices preferred); returns base64 audio |
| `lugemi_translate` | Translate source → target for dubbing/subtitles |
| `lugemi_video_voice_line` | Translate then synthesize in one call (dubbing pipeline) |
| `lugemi_voices_list` | Available voices |
| `lugemi_languages_list` | Language catalog |

## Run

```bash
export LUGEMI_API_KEY=lg_live_...
export LUGEMI_BASE_URL=https://api.lugemi.com   # optional
pnpm --filter @lugemi/mcp build
pnpm --filter @lugemi/mcp start
```

### MCP client config (stdio)

```json
{
  "mcpServers": {
    "lugemi": {
      "command": "node",
      "args": ["packages/mcp/dist/index.js"],
      "env": {
        "LUGEMI_API_KEY": "lg_live_...",
        "LUGEMI_BASE_URL": "https://api.lugemi.com"
      }
    }
  }
}
```

Pair with `@lugemi/cli` (`lugemi speech`, `lugemi video-voice`) and mobile SDKs under `packages/sdk-android` / `packages/sdk-ios`.
