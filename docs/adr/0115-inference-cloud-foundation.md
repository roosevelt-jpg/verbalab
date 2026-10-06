# ADR-0115: Inference Cloud Foundation (hub over AI Gateway, not a GPU hyperscaler)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-204 (library “Phase 71 Inference Cloud Foundation” mapped)

## Context

Library Phase 71 asks for VerbaLab Enterprise Inference Cloud as the runtime for every AI model — Model Serving, GPU Scheduler, CPU Runtime, Streaming/Batch, AI Router, Model Registry, Autoscaling, Intelligent Cache, Cost Optimizer, Multi Region Runtime — plus DDD/CQRS/hexagonal, REST/GraphQL/realtime, SDKs, CLI, Terraform, Docker, Kubernetes — “everything production ready.”

Volumes 1–6 already ship product clouds that call models through AI Gateway (VL-021), chat, and embeddings. Regenerating Gateway/orchestration or inventing a GPU hyperscaler would violate “extend, don’t regenerate.”

Volume 7 README (`docs/roadmap/volume7-inference-cloud/README_VOLUME7.md`) requires building underneath AI Orchestration / every model-calling cloud, and calls out **real bill risk** for GPU Platform (Phase 72) and Cost Optimization (Phase 78).

## Decision

1. **Schedule** Inference Cloud as executable **VL-204–213** (library Phases 71–80), mapped onto AI Gateway + vendor APIs.
2. **Map, don’t clone:** Document library terms → modules in `docs/INFERENCE_CLOUD.md`.
3. **Inference Cloud = parent hub** over Gateway/chat/embeddings — not a new microservice mesh or GPU OS.
4. **Ship:** `/inference-cloud` console + `GET /v1/inference-cloud/products` + `GET /v1/inference-cloud/overview` + bounded CQRS catalog port + GraphQL `inferenceProducts` + OpenAPI + thin SDK/CLI.
5. **Partial today:** CPU path via Nest + vendor adapters; streaming/batch via existing SSE/jobs; model registry bridge to `/models`.
6. **Defer:** GPU Platform, Model Serving product, AI Router product, dedicated Streaming/Batch runtimes, Intelligent Cache, Cost Optimization, AI Runtime Analytics, Autoscaling OS, Multi Region Runtime (VL-205–212).
7. **Spend safety:** GPU Platform must require hard ceilings + sandbox/dev billing; Cost Optimization must enforce caps. `openEndedGpuAutoscale: false` in architecture honesty.
8. **Architecture stays:** Nest modular monolith + REST primary; CQRS/hexagonal **slice** for Inference Cloud GraphQL only.
9. **Infra:** Reuse Docker/Fly/Actions/Terraform/EKS from platform; no Inference-specific cluster in Foundation.

## Consequences

- Inference products are discoverable from one hub with honest deferred flags and spend-safety notes.
- Later phases extend this catalog — they must not regenerate AI Gateway or Volumes 1–6, or invent GPU hyperscaler parity.
- Cloud Blueprint (ADR-0080) gains an Inference column starting at Foundation.
