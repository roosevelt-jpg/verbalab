# ADR-0117: Model Serving (Gateway hub + sandbox deployments, not vLLM OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-206 (library “Phase 73 Model Serving” mapped)

## Context

Library Phase 73 asks for Enterprise Model Serving covering LLMs, speech, voice, OCR, embedding, vision, and reasoning models, plus streaming, batch, realtime, autoscaling, canary, blue/green, rollback, versioning, REST/GraphQL/SDK/monitoring/docs, and production deployment.

VerbaLab already serves those model families through the AI Gateway and model registry. Inventing a vLLM/KServe/Triton control plane or regenerating Gateway would violate extend-don’t-regenerate (ADR-0115) and Volume 7’s spend-safety posture.

## Decision

1. Ship `/v1/model-serving/*` + `/model-serving` console as a **serving discovery + sandbox deployment hub** over Gateway + `/v1/models`.
2. Map library model kinds onto existing Gateway features; defer dedicated vision serving OS.
3. Implement streaming/batch/realtime as **partial** via existing SSE/jobs (dedicated products remain VL-208/209).
4. Implement canary/blue-green/rollback/versioning as **sandbox logical records** (`ModelServingDeployment`) with traffic %, slots, and previousVersion — not a service-mesh or Kubernetes deploy OS.
5. Defer serving autoscaler OS; GPU instance/spend hard ceilings stay on GPU Platform (VL-205).
6. Enforce `VERBALAB_MODEL_SERVING_MAX_ACTIVE` on deploy; `VERBALAB_MODEL_SERVING_MODE=disabled` blocks mutates.
7. Flip Inference Cloud catalog `model-serving` to partial; deferred flag → false.

## Consequences

- Developers can exercise serving versioning/canary/rollback workflows without a self-hosted GPU serving stack.
- AI Router (VL-207) can later route against these deployment metadata records.
- Real vendor inference remains on Gateway adapters; Cost Optimization (VL-211) still must enforce broader spend caps.
