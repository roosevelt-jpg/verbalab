# VerbaLab Voice Studio

**Status:** Shipped hub (VL-174 / library Phase 31)  
**Rule:** Professional studio over Neural TTS + VL-120 `/audio`. Linear timeline + SSML lite — **not** a nonlinear DAW / Descript / Premiere product. Vendors do **not** receive SSML markup.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Voice Studio / Professional Dashboard | **VL-174** — `/voice-studio` + legacy `/audio` (VL-120) |
| Voice Library | `GET /v1/voice-studio/library` |
| Voice Editing | **Partial** — saved profiles; waveform edit deferred |
| Pronunciation Editor | Workspace lexeme CRUD (≠ VL-156 assess) |
| Voice Profiles / Projects | Postgres presets + linear timelines |
| Audio Preview / Generate / Testing | `preview` / `generate` / `test` |
| Timeline Editing | **Partial** — ordered clips; not NLE |
| SSML Editor | **Partial** — SSML lite compile → plain plan |
| Voice Comparison | Multi-voice base64 clips |
| GraphQL / SDK / CLI | `voiceStudioEngine`, `voiceStudioLibrary` |
| Monitoring | Audit `voice_studio.*` + TTS metering |
| Production deployment | Shared Fly / Docker / optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/voice-studio` |
| African studio (legacy) | `/audio` |
| Engine | `GET /v1/voice-studio/engine` |
| Library | `GET /v1/voice-studio/library` |
| SSML compile | `POST /v1/voice-studio/ssml/compile` |
| Pronunciation | `GET|POST /v1/voice-studio/pronunciation` |
| Profiles / Projects | `/v1/voice-studio/profiles` · `/projects` |
| Preview / Generate / Test | `POST …/preview` · `/generate` · `/test` |
| Compare | `POST /v1/voice-studio/compare` |
| Timeline render | `POST /v1/voice-studio/timeline/render` |
| Docs | this file + ADR-0085 |

Voice Studio is **not** a full nonlinear audio/video NLE.

See ADR-0085. Hub: [`VOICE_CLOUD.md`](./VOICE_CLOUD.md).
