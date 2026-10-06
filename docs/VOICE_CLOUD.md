# VerbaLab Voice Cloud

**Status:** Volume complete through Production Audit (VL-170–179)  
**Rule:** Parent hub for voice synthesis products. Extend existing audio / voice-clone / studio modules. Do not regenerate Speech Cloud, Language Cloud, Identity, or AI Gateway. Follow the [12-layer Cloud Blueprint](./CLOUD_BLUEPRINT.md) (ADR-0080).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Voice Cloud Foundation | **VL-170** — `/voice-cloud` + product catalog / overview |
| Neural TTS | **VL-171** — `GET /v1/tts/engine`, `POST /v1/tts/synthesize` (+ legacy VL-042/121) |
| Streaming / Batch TTS productization | **Partial streaming** — chunk SSE `POST /v1/tts/stream`; batch shipped |
| Voice Cloning / Instant Cloning | **Shipped hub** — **VL-172** `/voice-cloning` over **VL-064** consent + review + watermark |
| Professional Voice Studio | **VL-174** — `/voice-studio` (+ legacy VL-120 `/audio`) |
| Emotion Voice | **Partial** — **VL-173** `/emotion-voice` soft prosody + voice profiles; trained expressive TTS deferred. Distinct from VL-154 detection |
| Voice Conversion | **Deferred** |
| Voice Enhancement | **Partial** — **VL-175** `/voice-enhancement` profiles over VL-155 heuristics |
| Voice Restoration / Audio Mastering | **Partial** — restore + broadcast soft-limit profiles; LUFS/ML deferred |
| Voice Biometrics / Authentication | **Partial** — **VL-176** `/voice-biometrics` over VL-152; heuristic anti-spoof/liveness; not NIST/PAD |
| Voice Profiles | **Partial** — speaker profiles (VL-152) |
| Voice Marketplace | **Partial** — **VL-177** `/voice-marketplace` (≠ localization `/marketplace`) |
| Voice Analytics | **Partial** — **VL-178** `/voice-analytics` (≠ Speech Analytics) |
| Production Audit | **VL-179** — evidence pack in [`voice-cloud-audit/`](./voice-cloud-audit/) |
| GraphQL / CQRS | Bounded Voice Cloud slice (products query + catalog port) |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console hub | `/voice-cloud` |
| REST catalog | `GET /v1/voice-cloud/products` (public) |
| REST overview | `GET /v1/voice-cloud/overview` (Clerk session) |
| GraphQL | `voiceProducts` |
| OpenAPI | `/v1/openapi.json` |
| SDK | `voiceProducts()` on `@verbalab/sdk` |
| CLI | `verbalab voice-products` |
| Docs | this file + ADR-0081 |

---

## Trust / safety (cloning)

Voice cloning already wires Identity/Trust foundations (VL-064 / ADR-0042):

- Explicit consent attestation before clone enrollment  
- Abuse review (`pending_review` → approve/reject)  
- Watermark header required when speaking via `clone:{id}`  
- Audit events on clone create/review/disable  

Later Phase 29 must **extend** these controls, not bypass them.

---

## Architecture honesty

Voice Cloud is a **bounded enterprise voice API hub** in the Nest modular monolith:

- DDD / hexagonal / CQRS apply to the **Voice Cloud application slice** (catalog ports + GraphQL queries) — not a greenfield rewrite of `AudioModule` / `VoiceClonesModule`.
- Event-driven = existing audit + jobs only.
- Streaming TTS product surface = deferred (Phase 28).
- Monitoring / billing = shared observability + TTS character metering + Stripe entitlements.
- Infra = Docker + Fly + GitHub Actions + optional Terraform/EKS (shared).

Voice Cloud is **not** ElevenLabs + Resemble + Nuance + Amazon Polly + Adobe Podcast + Clearview biometrics combined.

Cloud blueprint: [`CLOUD_BLUEPRINT.md`](./CLOUD_BLUEPRINT.md) (ADR-0080). ADR: [`adr/0081-voice-cloud-foundation.md`](./adr/0081-voice-cloud-foundation.md).

Library phase pack: [`roadmap/volume3-voice-cloud/`](./roadmap/volume3-voice-cloud/).
