# ADR-0083: Voice Cloning Platform (governance hub over VL-064)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-172 (library “Phase 29 Voice Cloning Platform” mapped)

## Context

Library Phase 29 asks for professional + instant cloning, secure enrollment, verification, ownership, licensing, permissions, enterprise library, consent management, plus REST/realtime/SDK/dashboard/monitoring/analytics.

VL-064 already ships ElevenLabs Instant Voice Cloning with consent attestation, abuse review, and watermark. Regenerating that path or skipping trust gates would violate Volume 3 safety guidance. True multi-hour professional clone training is a buy/vendor depth issue.

## Decision

1. **Product hub** `/v1/voice-cloning/*` over `VoiceClonesService` — do not fork synthesis.  
2. **Extend schema** with `cloneMode`, ownership, license, permissions, enrollment verification.  
3. **Instant** = existing 1+ sample consent path; **professional** = ≥3 samples + ownership attestation on the same ElevenLabs IVC path (honest partial).  
4. **Ship** consent policy endpoint, library, ownership/license/permissions patches, enrollment verify, enroll SSE progress, analytics, `/voice-cloning` console, GraphQL/SDK/CLI.  
5. **Keep** watermark + pending_review gates mandatory; audit all governance mutations.  
6. **Defer** NIST PAD/anti-spoof biometrics (Phase 33) and marketplace voice SKUs (Phase 34).

## Consequences

- Voice Cloud catalog marks cloning/instant as shipped (hub).  
- Studio `/audio` remains the rich enroll UI; cloning console is governance + library.  
- Later phases must extend these fields/gates, not weaken them.
