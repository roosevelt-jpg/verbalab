# Inference Cloud — Architecture Report (VL-213)

**Date:** 2026-10-03  
**Scope:** VL-204–212 Inference Cloud volume (+ AI Gateway VL-021)

## Verdict

Inference Cloud is a **hub over Nest modular monolith model-runtime modules**, not a separate GPU cluster OS and not an AI Kernel. REST is primary; GraphQL is a façade; CQRS applies to the Inference Cloud catalog slice (VL-204).

Clouds follow the **12-layer Lugemi Cloud Blueprint** (ADR-0080).

## System shape

| Layer | Reality |
| --- | --- |
| Runtime | NestJS API (`apps/api`) + Next.js console (`apps/web`) |
| Data | Postgres; Redis for jobs/rate limits |
| Hub | `GET /v1/inference-cloud/products` + `/inference-cloud` console |
| Deploy | Fly.io default; optional AWS EKS `af-south-1` |
| Blueprint | ADR-0080 (Foundation → Production Audit) |

## Capability map (honest)

| Product | VL | Status note |
| --- | --- | --- |
| Foundation | 204 | Hub/catalog/overview; extends Gateway |
| GPU Platform | 205 | Sandbox pools/allocate/scale + hard ceilings |
| Model Serving | 206 | Gateway/registry hub + sandbox canary/blue-green |
| AI Router | 207 | Dry-run resolve; spend gated by VL-211 |
| Streaming Runtime | 208 | SSE hub + sandbox LLM chunks |
| Batch Runtime | 209 | BullMQ + sandbox runs |
| Intelligent Cache | 210 | Opt-in exact-key / normalized-hash |
| Cost Optimization | 211 | Hard daily/monthly enforce |
| AI Runtime Analytics | 212 | Inference aggregates; ≠ sibling analytics |

## Integration findings

- Catalogs discoverable; org/workspace scoping on authed inference routes.
- GraphQL exposes inference product engines without regenerating REST.
- AI Router resolves over Gateway adapters; Model Serving weights blend into routing.
- Cost Optimization gates router resolve; GPU allocate/scale clamp to hard ceilings.
- Sibling Language/Speech/Voice/Intelligence/Knowledge analytics are **not** regenerated.

## Rejected architecture claims

- GPU hyperscaler / cloud GPU API OS / open-ended autoscale  
- vLLM / KServe / Triton serving OS  
- Service mesh / multi-cloud router OS  
- Redis Cluster / vector ANN / CDN cache OS  
- FinOps / Spot marketplace / reserved-instance broker  
- BI/APM runtime analytics OS  
- **AI Kernel invented in this audit** (Volume 8 when scheduled)
