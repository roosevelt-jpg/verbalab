# ADR-0069: Speech Cloud Foundation (hub over audio products, not a speech OS)

- Status: Accepted
- Date: 2026-09-07
- Phase: VL-150 (library “Phase 16 Speech Cloud Foundation” mapped)

## Context

Library Phase 16 asks for VerbaLab Speech, Streaming/Batch STT, Speaker/Audio/Call Intelligence, Pronunciation/Emotion AI, Voice Biometrics, Wake Word, Audio Enhancement — plus DDD, CQRS, hexagonal, realtime/streaming/batch, enterprise APIs, SDKs, CLI, monitoring, billing, analytics, Terraform, Docker, Kubernetes — “everything production ready.”

VerbaLab already ships vendor STT/TTS (VL-041/042), interpreter (VL-061), voice clones (VL-064), Voice Studio (VL-120), own TTS (VL-121), and accent cue detection (VL-132). Regenerating Language Cloud / Identity / Gateway or inventing a full speech-intelligence OS would violate “extend, don’t regenerate.” VL-147 explicitly deferred Speech Cloud kickoff to a separate phase.

## Decision

1. **Map, don’t clone:** Document library terms → modules in `docs/SPEECH_CLOUD.md`.
2. **Speech Cloud = parent hub** over existing audio/voice surfaces — not a new microservice.
3. **Ship:** `/speech` console + `GET /v1/speech/products` + `GET /v1/speech/overview` + bounded CQRS catalog port + GraphQL `speechProducts` + OpenAPI + thin SDK/CLI.
4. **Shipped products:** Batch STT, TTS/voices, interpreter; partial voice biometrics (clones) and Voice FAQ; accent cue scoring via Language Cloud.
5. **Defer:** Streaming STT, Speaker/Emotion/Audio/Pronunciation/Wake-Word/Call Intelligence, Audio Enhancement, Speech Analytics product (Phases 17–25 / VL-122+).
6. **Architecture stays:** Nest modular monolith + REST primary; CQRS/hexagonal **slice** for Speech Cloud GraphQL only — ENGINEERING_OS, not greenfield DDD rewrite of `AudioModule`.
7. **Infra:** Reuse Docker/Fly/Actions/Terraform/EKS from platform (ADR-0059); no speech-specific cluster.

## Consequences

- Speech products are discoverable from one hub with honest deferred flags.
- Later Speech Cloud phases extend this catalog and add real engines — they must not regenerate Volume 1.
