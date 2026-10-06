# Lugemi MCP

Connect agent IDEs to first-party Lugemi models over the Model Context Protocol.

**Models:** Baobab (translate) · Echo (TTS / STT) · Atlas (reasoning catalog)  
**Auth:** `Authorization: Bearer lg_live_…` or `lg_test_…`  
**Marketing:** [/mcp](/mcp) · **Discovery:** `GET /v1/mcp`

## Tools

| Tool | Purpose |
| --- | --- |
| `lugemi_translate` | Baobab MT |
| `lugemi_tts_synthesize` / `lugemi_speech_synthesize` | Echo Voice TTS |
| `lugemi_transcribe` | Echo Listen STT (`audioBase64` + `filename`, or `filePath` on stdio) |
| `lugemi_mix_transcribe_translate` | Mix: STT → translate (`textHint` for demos) |
| `lugemi_video_voice_line` | Translate then TTS |
| `lugemi_voices_list` | `own:*` voices |
| `lugemi_voice_clones_list` | Workspace `clone:{id}` refs |
| `lugemi_languages_list` | Language catalog |
| `lugemi_accents_list` | Spoken accent profiles |
| `lugemi_accent_identity_list` | Accent identity packs |
| `lugemi_accent_identity_play` | Play metadata (+ optional synthesize) |
| `lugemi_models_list` | Baobab / Echo / Atlas live matrix |

## Hosted Streamable HTTP

Production endpoint: `https://api.lugemi.com/v1/mcp`

### Cursor

`~/.cursor/mcp.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "lugemi": {
      "url": "https://api.lugemi.com/v1/mcp",
      "headers": {
        "Authorization": "Bearer lg_live_..."
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add --transport http lugemi https://api.lugemi.com/v1/mcp \
  --header "Authorization: Bearer lg_live_..."
```

### Claude Desktop

Claude Desktop uses stdio natively. Bridge remote HTTP:

```json
{
  "mcpServers": {
    "lugemi": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.lugemi.com/v1/mcp",
        "--header",
        "Authorization: Bearer lg_live_..."
      ]
    }
  }
}
```

## Local stdio (`@lugemi/mcp`)

```bash
export LUGEMI_API_KEY=lg_live_...
export LUGEMI_BASE_URL=https://api.lugemi.com   # or http://127.0.0.1:3001
pnpm --filter @lugemi/mcp build
pnpm --filter @lugemi/mcp start
```

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

Package: `packages/mcp` · bin: `lugemi-mcp`.

## Local API

When developing against this monorepo:

- API: `http://127.0.0.1:3001/v1/mcp`
- Web marketing page: Studio port `/mcp` (often `http://127.0.0.1:43125/mcp`)

Create keys in the console under `/keys`.
