# VerbaLab Speech Cloud

**Status:** Volume complete through Production Audit (VL-150–160)  
**Rule:** Parent hub for speech capabilities. Extend existing audio/voice modules. Do not regenerate Language Cloud, Identity, or AI Gateway. Follow the [12-layer Cloud Blueprint](./CLOUD_BLUEPRINT.md) (ADR-0080).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Speech Cloud Foundation | **VL-150** — `/speech` + product catalog / overview |
| Speech Recognition Engine | **VL-151** — see [`SPEECH_RECOGNITION.md`](./SPEECH_RECOGNITION.md) |
| Batch STT | **VL-041** — `POST /v1/audio/transcriptions` |
| Streaming STT | **Partial** — Phase 17 / **VL-151** SSE segment stream (`POST /v1/speech/stream`). Live-mic WebSocket deferred. |
| TTS / voices | **VL-042 / VL-121** — `POST /v1/audio/speech`, `GET /v1/audio/voices` |
| Speaker Intelligence | **Partial** — **VL-152** profiles/fingerprints/verify/identify/gap diarization. Not NIST / neural diarization. |
| Accent Intelligence | **Partial** — **VL-153** engine/classify/analytics over VL-132 cues. Acoustic regional models deferred. Dialect = Language Cloud VL-131. |
| Emotion AI (audio) | **Partial** — **VL-154** cue detect + soft audio proxies. Trained SER deferred. Language Intel emotion remains separate. |
| Audio Intelligence | **Partial** — **VL-155** noise/silence/enhance/upscale/isolate. Echo AEC deferred. Not Krisp/Demucs. |
| Pronunciation AI | **Partial** — **VL-156** assess/score/coach + phoneme/fluency heuristics. Forced alignment deferred. |
| Wake Word Engine | **Partial** — **VL-157** wake/keyword/trigger spotting via text/STT. On-device DNN deferred. |
| Call Intelligence | **Partial** — **VL-158** ingest/transcribe/analyze/report. Heuristic coaching/QA. Not Gong. Voice FAQ ≠ this. |
| Speech Analytics | **Partial** — **VL-159** usage/languages/costs/accuracy proxies/report. Not BI/WER lab. Language Analytics separate. |
| Production Audit | **VL-160** — evidence pack in [`speech-cloud-audit/`](./speech-cloud-audit/) |
| Voice Biometrics | Partial — **VL-064** consent-gated clones |
| Audio Enhancement | **Partial** — under Audio Intelligence enhance (VL-155) |
| Live interpreter | **VL-061** — `POST /v1/interpret` |
| GraphQL / CQRS | Bounded Speech Cloud slice (products query + catalog port) |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console hub | `/speech` |
| REST catalog | `GET /v1/speech/products` (public) |
| REST overview | `GET /v1/speech/overview` (Clerk session) |
| GraphQL | `speechProducts` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `speechProducts()` on `@verbalab/sdk` |
| CLI | `verbalab speech-products` |
| Docs | this file + ADR-0069 |

---

## Architecture honesty

Speech Cloud is a **bounded enterprise speech API hub** in the Nest modular monolith:

- DDD / hexagonal / CQRS apply to the **Speech Cloud application slice** (catalog ports + GraphQL queries) — not a greenfield rewrite of `AudioModule`.
- Event-driven = existing audit + jobs only.
- Realtime / streaming = **partial** (SSE segment/product streams); live-mic WebSocket deferred.
- Batch = file STT today.
- Monitoring / billing / analytics = shared observability + STT/TTS usage metering + Stripe entitlements; dedicated Speech Analytics product is **VL-159** (`/speech-analytics`).
- Infra = Docker + Fly + GitHub Actions + optional Terraform/EKS (shared with Language Cloud).

Speech Cloud is **not** Deepgram + AssemblyAI + Twilio Voice Intelligence + Nuance + Amazon Transcribe + Gong combined.

Audit evidence: [`speech-cloud-audit/`](./speech-cloud-audit/) (VL-160). Cloud blueprint: [`CLOUD_BLUEPRINT.md`](./CLOUD_BLUEPRINT.md) (ADR-0080).

See ADR-0069–0080.
