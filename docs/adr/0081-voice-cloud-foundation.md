# ADR-0081: Voice Cloud Foundation (hub over TTS/clones/studio, not a voice OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-170 (library “Phase 27 Voice Cloud Foundation” mapped)

## Context

Library Phase 27 asks for VerbaLab Voice, Neural TTS, Voice Cloning, Instant Cloning, Professional Voice Studio, Emotion Voice, Voice Conversion, Enhancement/Restoration/Mastering, Voice Biometrics/Authentication/Profiles, Voice Marketplace — plus DDD, CQRS, hexagonal, REST/GraphQL/realtime, SDKs, CLI, Terraform, Docker, Kubernetes, monitoring, billing, analytics — “everything production ready.”

VerbaLab already ships vendor + own TTS (VL-042/121), consent-gated cloning (VL-064), Voice Studio UX (VL-120), speaker verify/identify (VL-152), and audio enhance (VL-155). Regenerating Speech/Language/Identity/Gateway or inventing a full voice-OS would violate “extend, don’t regenerate.” ADR-0080 previously left Voice Cloud unscheduled until ROADMAP executable phases existed; Volume 3 schedules VL-170+.

## Decision

1. **Map, don’t clone:** Document library terms → modules in `docs/VOICE_CLOUD.md`.
2. **Voice Cloud = parent hub** over existing TTS / clones / studio / speaker / enhance surfaces — not a new microservice.
3. **Ship:** `/voice-cloud` console + `GET /v1/voice-cloud/products` + `GET /v1/voice-cloud/overview` + bounded CQRS catalog port + GraphQL `voiceProducts` + OpenAPI + thin SDK/CLI.
4. **Shipped / partial today:** Neural TTS + voices + Voice Studio; partial cloning (consent/watermark), enhancement, biometrics/auth/profiles via speaker intel.
5. **Defer:** Streaming TTS productization, professional cloning, emotion synthesis, conversion, restoration/mastering, NIST biometrics/anti-spoof, voice marketplace, voice analytics (Phases 28–35 / VL-171+).
6. **Architecture stays:** Nest modular monolith + REST primary; CQRS/hexagonal **slice** for Voice Cloud GraphQL only.
7. **Infra:** Reuse Docker/Fly/Actions/Terraform/EKS from platform (ADR-0059); no voice-specific cluster.
8. **Trust:** Cloning continues to require consent + review + watermark + audit (ADR-0042); later cloning phases must extend these gates.

## Consequences

- Voice products are discoverable from one hub with honest deferred flags.
- Later Voice Cloud phases extend this catalog and add real engines — they must not regenerate Volumes 1–2.
- Cloud Blueprint (ADR-0080) gains a Voice column starting at Foundation.
