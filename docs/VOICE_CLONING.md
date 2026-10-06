# Lugemi Voice Cloning Platform

**Status:** Shipped hub (VL-172 / library Phase 29)  
**Rule:** Extend VL-064 Instant Voice Cloning (vendor_clone). Do not skip consent, abuse review, or watermark. Do not claim multi-hour professional model training.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Voice Cloning Engine | **VL-172** — `GET /v1/voice-cloning/engine` + `/voice-cloning` |
| Instant Voice Cloning | **Shipped** — `POST /v1/voice-cloning/enroll` (`cloneMode=instant`) |
| Professional Voice Cloning | **Partial** — stricter enrollment (≥3 samples + ownership); still vendor_clone IVC |
| Secure Voice Enrollment | **Shipped** — `POST …/verify-enrollment` sample/consent gate |
| Voice Verification | **Partial** — speaker verify VL-152; enrollment verify ≠ PAD/anti-spoof |
| Voice Ownership | **Shipped** — `PATCH …/ownership` (separate from consent) |
| Voice Licensing | **Shipped** — internal / commercial / restricted tags |
| Voice Permissions | **Shipped** — synthesize/share/export + allowedRoles |
| Enterprise Voice Library | **Shipped** — `GET /v1/voice-cloning/library` |
| Consent Management | **Shipped** — `GET /v1/voice-cloning/consent/policy` + audited create |
| Realtime | **Partial** — `POST /v1/voice-cloning/enroll/stream` SSE progress |
| Analytics | **Partial** — `GET /v1/voice-cloning/engine/analytics` |
| GraphQL / SDK / CLI | `voiceCloningEngine`, consent policy helpers |
| Production deployment | Shared Fly / Docker / optional EKS `af-south-1` |

---

## Trust gates (non-negotiable)

1. **Consent:** `consentAttested=true` + descriptive `consentNotes` (min 8 chars) — not ToS-only.  
2. **Abuse review:** clones start `pending_review`; owner/admin approve/reject.  
3. **Watermark:** approved clone speech always `X-Lugemi-Watermark: required`.  
4. **Ownership:** professional enroll requires ownership attestation; API available for all clones.  
5. **Audit:** `voice_clone.*` events for create, ownership, license, permissions, verify, review, disable.

Legacy paths `/v1/voice-clones` remain supported.

---

## Honesty

- Primary engine: **Instant Voice Cloning (vendor_clone)**.  
- Professional mode is **enrollment rigor**, not a separate trained pro model.  
- Voice Cloning is **not** a third-party clone marketplace + overdub + NIST biometrics + marketplace combined.

See ADR-0083. Hub: [`VOICE_CLOUD.md`](./VOICE_CLOUD.md). Prior: ADR-0042.
