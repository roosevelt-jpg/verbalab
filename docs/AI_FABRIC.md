# VerbaLab AI Fabric

**Status:** Volume closed (VL-239–248 / library Phases 106–115) — audit pack under [`docs/ai-fabric-audit/`](./ai-fabric-audit/)  
**Rule:** AI Fabric is the **internal** communication layer connecting VerbaLab clouds — **not** a customer-facing product, Kafka hyperscaler, or service-mesh OS. Extends AI Kernel + Inference Cloud. Do **not** regenerate Volumes 1–9. Roadmap: [`docs/roadmap/volume10-ai-fabric/`](./roadmap/volume10-ai-fabric/).

Volume 10 README: this volume is buildable bus/messaging infrastructure (Kafka/NATS/RabbitMQ/Redis Streams/CloudEvents named for Event Fabric). Policy Fabric is a **hard gate**, not log-only (VL-247 verified).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| AI Fabric Foundation | **VL-239** — `/ai-fabric` + bus catalog / routing |
| Event Fabric | **Shipped** — VL-240 — Redis Streams + CloudEvents; Kafka/NATS/Rabbit adapters deferred |
| Context Fabric | **Shipped** — VL-241 — router over Context Runtime |
| Knowledge Fabric | **Shipped** — VL-242 — router over Knowledge Cloud |
| Prompt Fabric | **Shipped** — VL-243 — router over Prompt Runtime |
| Reasoning Fabric | **Shipped** — VL-244 — router over Reasoning Runtime |
| Memory Fabric | **Shipped** — VL-245 — router over Memory Runtime |
| Agent Fabric | **Shipped** — VL-246 — sandboxed + Policy-gated router over Agent Runtime |
| Policy Fabric | **Shipped** — VL-247 — fabric-wide hard gate (403 on deny; not log-only) |
| Production Audit | **Shipped** — VL-248 — [`docs/ai-fabric-audit/`](./ai-fabric-audit/) |
| Service Discovery | **Partial** — static routing catalog |
| Identity Propagation | **Partial** — Clerk session + request IDs |
| Observability / Telemetry | **Partial** — existing platform logs/metrics |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slice — `hexagonalRewrite: false` |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console (internal) | `/ai-fabric` |
| REST catalog | `GET /v1/ai-fabric/products` (public) |
| REST engine | `GET /v1/ai-fabric/engine` |
| REST routing | `GET /v1/ai-fabric/routing` |
| REST overview | `GET /v1/ai-fabric/overview` (Clerk session) |
| Monitoring | `GET /v1/ai-fabric/monitoring` |
| GraphQL | `aiFabricBuses` |
| SDK | `aiFabricProducts()` |
| CLI | `verbalab ai-fabric-products` |

## Action safety (README)

1. **Policy Fabric (Phase 114)** — must hard-gate across fabric buses (requests blocked), not log/flag-only.
2. Until Policy Fabric ships, **Policy Runtime** remains the hard gate for Agent/Workflow/Plugin.

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | false |
| `kafkaHyperscalerOs` | false |
| `serviceMeshOs` | false |
| `regeneratesVolumes1to9` | false |
| `fabricWidePolicyHardGateRequired` | true |
| `policyLogOnlyForbidden` | true |
| `brokerBackendsDeferred` | false |
| `redisStreamsActive` | true (via Event Fabric) |
| `kafkaAdapterDeferred` | true |

See ADR-0141. Event Fabric: [`EVENT_FABRIC.md`](./EVENT_FABRIC.md) / ADR-0142.
