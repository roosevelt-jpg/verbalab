# ADR-0087: Voice Biometrics (governance over Speaker Intelligence)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-176 (library “Phase 33 Voice Biometrics” mapped)

## Context

Library Phase 33 asks for enterprise voice biometrics: authentication, verification, identification, fraud, anti-spoof, liveness, risk scoring, engine, REST/GraphQL/SDK/dashboard/monitoring/docs.

Lugemi already ships Speaker Intelligence (VL-152) with local fingerprints. Claiming NIST/PAD/ASVspoof certification would be dishonest. ROADMAP prefers a specialist vendor for regulated auth and asks us to harden governance (encryption-at-rest, deletion, honest heuristics).

## Decision

1. Ship **Voice Biometrics** under `/v1/voice-biometrics/*` + console `/voice-biometrics`.  
2. **Extend** VL-152 — encrypt fingerprint JSON with AES-256-GCM; decrypt on verify/identify.  
3. **Deletion path** purges templates and marks profiles deleted.  
4. **Anti-spoof / liveness** are heuristic only (`certifiedPad: false`).  
5. **Authenticate** composes verify + spoof + risk → accept / step_up / reject.  
6. Do **not** claim NIST/PAD certification.

## Consequences

- Voice Cloud biometrics/auth mark `partial` with honest notes.  
- Specialist vendor can later replace heuristics behind the same API.  
- Legacy `/speaker-intelligence` remains the profile/diarize surface.
