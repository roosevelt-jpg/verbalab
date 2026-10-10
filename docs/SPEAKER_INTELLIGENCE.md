# Lugemi Speaker Intelligence

**Status:** Partial shipped (VL-152 / library Phase 18)  
**Rule:** Bounded speaker profiles + local fingerprints + gap diarization. Do not claim NIST biometrics or neural diarization OS.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Speaker Intelligence / Engine | **VL-152** — `GET /v1/speakers/engine` + `/speaker-intelligence` |
| Speaker Profiles | **Shipped** — CRUD `/v1/speakers/profiles` |
| Voice Fingerprints | **Partial** — local energy/spectral envelope vector on enroll |
| Speaker Verification (1:1) | **Partial** — cosine match vs enrolled profile |
| Speaker Identification (1:N) | **Partial** — top-K cosine match in workspace |
| Speaker Diarization | **Partial** — silence-gap clustering over Whisper segments |
| Speaker History | **Shipped** — `GET /v1/speakers/history` |
| Realtime APIs | **Partial** — SSE `POST /v1/speakers/diarize/stream` |
| GraphQL / SDK / CLI | `speakerEngine`, `speakerProfiles`, `createSpeakerProfile`, enroll/verify/identify/diarize helpers |
| Monitoring / docs / deploy | Shared observability + this doc + ADR-0071; Fly / optional EKS |

---

## Honesty

Speaker Intelligence is **not** pyannote + Nuance + Amazon Voice ID + Microsoft Speaker Recognition combined.  
Voice clones (`/v1/voice-clones`) remain TTS consent clones — not verification.

Enterprise auth governance (encryption-at-rest, deletion, heuristic anti-spoof/liveness) ships under Voice Biometrics (**VL-176** / [`VOICE_BIOMETRICS.md`](./VOICE_BIOMETRICS.md)).

See ADR-0071.
