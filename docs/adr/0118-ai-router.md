# ADR-0118: AI Router (Gateway dry-run routing, not a mesh)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-207 (library “Phase 74 AI Router” mapped)

## Context

Library Phase 74 asks for an AI Router covering model/provider/inference selection, latency/cost optimization, regional routing, fallback, retries, caching, streaming, and load balancing, plus REST/GraphQL/SDK/monitoring/docs and production deployment.

VerbaLab already routes via AI Gateway adapters (primary + fallback providers) and Decision Engine helpers. Inventing a service mesh or multi-cloud router OS would violate extend-don’t-regenerate (ADR-0115). Caching belongs to Intelligent Cache (VL-210); spend enforcement to Cost Optimization (VL-211).

## Decision

1. Ship `/v1/ai-router/*` + `/ai-router` as a **dry-run route planner** over Gateway candidate matrices.
2. Persist org/workspace `AiRouterPolicy` (optimize, retries, region, preferProvider) and log `AiRouterDecision` rows.
3. Support optimize modes `latency|cost|balanced|quality` using **estimated** latency/cost — not live RTT probing.
4. Blend Model Serving canary `trafficPercent` into candidate weights when deployments exist.
5. Defer inference result caching; mark streaming as capability flag only; keep spend-cap enforcement out of this phase (`enforcesSpendCaps: false`).
6. Flip Inference Cloud catalog `ai-router` to partial; deferred flag → false.

## Consequences

- Callers can preview which provider/model would be chosen before hitting Gateway.
- Gateway remains the execution path; Router does not invoke vendors itself.
- VL-211 must still enforce hard spend limits; VL-210 owns cache.
