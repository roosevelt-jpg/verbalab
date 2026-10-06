# VerbaLab Streaming Runtime

**Status:** Partial (VL-208 / library Phase 75)  
**Parent:** [Inference Cloud](./INFERENCE_CLOUD.md)  
**Rule:** SSE hub that **catalogs existing** speech/voice/translation streams and adds a **sandbox LLM/token chunk** stream. Authed sessions are org/workspace-scoped. Does **not** invent WebSocket, gRPC, or video streaming OS. Does **not** regenerate product SSE endpoints.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/streaming-runtime` |
| Engine | `GET /v1/streaming-runtime/engine` |
| Surfaces / transports | `GET …/surfaces` · `/transports` |
| Sessions | `GET/POST /v1/streaming-runtime/sessions` |
| Sandbox SSE | `POST /v1/streaming-runtime/stream` |
| Analytics / monitoring | `GET …/analytics` · `/monitoring` |
| GraphQL | `streamingRuntimeEngine` |
| SDK / CLI | `streamingRuntimeEngine()` · `verbalab streaming-runtime-engine` |

## Library map

| Ask | Status |
| --- | --- |
| Speech / Voice / Translation streaming | partial — links existing product SSE |
| LLM streaming | partial — sandbox token-chunk SSE on this hub |
| Video streaming | deferred |
| Realtime APIs | partial — discoverable SSE surfaces |
| WebSockets | deferred |
| SSE | shipped (primary transport) |
| gRPC | deferred |

## Existing streams (not regenerated)

- `POST /v1/speech/stream`
- `POST /v1/tts/stream`
- `POST /v1/translate/stream`

## Env

| Control | Default | Env |
| --- | --- | --- |
| Mode | `sandbox` | `VERBALAB_STREAMING_RUNTIME_MODE=disabled\|sandbox` |
| Max chunks / stream | 64 (cap 256) | `VERBALAB_STREAMING_MAX_CHUNKS` |

## Honesty

| Flag | Value |
| --- | --- |
| `websocketOs` | false |
| `grpcStreamingOs` | false |
| `videoStreamingOs` | false |
| `bidirectionalRealtimeOs` | false |
| `regeneratesExistingStreams` | false |
| `extendsExistingSse` | true |
| `openaiTokenStreamOs` | false |

See ADR-0119.
