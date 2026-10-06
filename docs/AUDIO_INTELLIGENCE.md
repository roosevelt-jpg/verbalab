# VerbaLab Audio Intelligence

**Status:** Partial shipped (VL-155 / library Phase 21)  
**Rule:** PCM heuristic DSP for noise/silence/enhance/upscale/isolate. Do not claim Krisp, Adobe Enhance, Demucs, or live AEC.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Audio Intelligence / Engine | **VL-155** — `GET /v1/audio-intelligence/engine` + `/audio-intelligence` |
| Noise Detection | **Shipped** — `POST /v1/audio-intelligence/analyze` |
| Silence Detection | **Shipped** — `POST /v1/audio-intelligence/silence` |
| Noise Removal / Enhancement | **Partial** — `POST /v1/audio-intelligence/enhance` (gate + HPF + normalize) |
| Audio Upscaling | **Partial** — `POST /v1/audio-intelligence/upscale` (linear resample) |
| Voice Isolation / Background Separation | **Partial** — `POST /v1/audio-intelligence/isolate` (energy VAD) |
| Echo Cancellation | **Deferred** — `GET /v1/audio-intelligence/echo` |
| Realtime | **Partial** — `POST /v1/audio-intelligence/analyze/stream` SSE |
| Monitoring | Audit `audio_intelligence.*` + shared observability |
| GraphQL / SDK / CLI | `audioEngine`, `analyzeAudio` / `enhanceAudio` / `isolateAudio`, `verbalab audio-engine` |
| Production | Shared Fly/Docker/K8s platform |

---

## Honesty

WAV PCM preferred. Not vendor denoise / generative upscaling / stem separation. See ADR-0074.

Productized cleanup profiles (mic/podcast/meeting/broadcast/restore) live under Voice Enhancement (**VL-175** / [`VOICE_ENHANCEMENT.md`](./VOICE_ENHANCEMENT.md)).
