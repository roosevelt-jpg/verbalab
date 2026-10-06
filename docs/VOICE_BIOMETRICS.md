# VerbaLab Voice Biometrics

**Status:** Partial (VL-176 / library Phase 33)  
**Rule:** Enterprise voice auth governance over Speaker Intelligence (VL-152). **Not** NIST / PAD / ASVspoof certified. Prefer a specialist vendor for regulated MFA.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Biometric Engine | **VL-176** — `GET /v1/voice-biometrics/engine` + `/voice-biometrics` |
| Voice Authentication | **Partial** — `POST …/authenticate` (verify + spoof + risk) |
| Speaker Verification / Identification | **Partial** — delegates to VL-152 (decrypts encrypted templates) |
| Fraud Detection / Risk Scoring | **Partial** — reject-rate heuristics |
| Anti Spoofing | **Partial** — clipping/dynamics/flatness proxies (`certifiedPad=false`) |
| Liveness Detection | **Partial** — challenge + duration/energy (`certifiedLiveness=false`) |
| Encryption at rest | **Shipped** — AES-256-GCM on fingerprint JSON |
| Deletion | **Shipped** — `DELETE …/profiles/:id` purges template |
| GraphQL / SDK / CLI | `voiceBiometricsEngine`, encryption status |
| Dashboard / Monitoring / Docs / Deploy | `/voice-biometrics` + audit + this doc + ADR-0087 |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/voice-biometrics` |
| Legacy speakers | `/speaker-intelligence` (VL-152) |
| Engine / Encryption | `GET /v1/voice-biometrics/engine` · `/encryption` |
| Enroll / Verify / Identify | `POST …/enroll` · `/verify` · `/identify` |
| Authenticate | `POST …/authenticate` |
| Anti-spoof / Liveness / Risk | `…/anti-spoof` · `/liveness` · `/risk` |
| Delete | `DELETE …/profiles/:id` |

Voice Biometrics is **not** NIST-certified speaker recognition.

See ADR-0087. Parent: [`SPEAKER_INTELLIGENCE.md`](./SPEAKER_INTELLIGENCE.md). Hub: [`VOICE_CLOUD.md`](./VOICE_CLOUD.md).
