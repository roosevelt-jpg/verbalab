# VerbaLab Event Fabric

**Status:** Shipped (VL-240 / library Phase 107)  
**Rule:** Event Fabric is the **internal** event/message bus for AI Fabric — **not** a Kafka hyperscaler, NATS/Rabbit cluster OS, or customer-facing product. Extends AI Fabric Foundation. Do **not** regenerate Volumes 1–9. Roadmap: [`docs/roadmap/volume10-ai-fabric/`](./roadmap/volume10-ai-fabric/).

Volume 10 README names Kafka / NATS / RabbitMQ / Redis Streams / CloudEvents. This phase wires a **real** Redis Streams path (plus in-memory fallback) with CloudEvents envelopes, versioning, DLQ, retries, replay, and snapshots. Kafka/NATS/RabbitMQ remain honest deferred adapters.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Event Fabric / Event Platform | **VL-240** — `/event-fabric` + bus APIs |
| Redis Streams | **Active** — `REDIS_URL` XADD/XREADGROUP; memory if unavailable |
| CloudEvents | **Shipped** — 1.0 envelope on publish |
| Event Versioning / DLQ / Retries / Replay / Snapshots | **Shipped** on the Redis/memory path |
| Kafka / NATS / RabbitMQ | **Deferred adapters** — catalogued, not provisioned |
| REST / SDK / Monitoring / Analytics / Docs | **Shipped** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console (internal) | `/event-fabric` |
| REST catalog | `GET /v1/event-fabric/products` |
| REST brokers | `GET /v1/event-fabric/brokers` |
| Publish | `POST /v1/event-fabric/events` |
| Poll / consume | `GET /v1/event-fabric/events?topic=` |
| Fail → retry/DLQ | `POST /v1/event-fabric/events/:streamId/fail` |
| DLQ list / retry | `GET /v1/event-fabric/dlq`, `POST /v1/event-fabric/dlq/retry` |
| Replay | `POST /v1/event-fabric/replay` |
| Snapshots | `GET /v1/event-fabric/snapshots` |
| Analytics / monitoring | `GET /v1/event-fabric/analytics`, `/monitoring` |
| Overview | `GET /v1/event-fabric/overview` (Clerk) |
| GraphQL | `eventFabricCapabilities`, `eventFabricBrokers` |
| SDK | `eventFabricProducts()`, `eventFabricPublish()`, … |
| CLI | `verbalab event-fabric-products` |

## Env

| Variable | Effect |
| --- | --- |
| `REDIS_URL` | Redis Streams backend (default `redis://127.0.0.1:6379`) |
| `EVENT_FABRIC_MEMORY=1` | Force in-memory streams (also when `JOBS_INLINE=1`) |

## Action safety

1. **Policy Fabric (VL-247)** — must hard-gate across fabric buses, not log-only.
2. Until then, **Policy Runtime** hard-gates Agent/Workflow/Plugin.

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | false |
| `kafkaHyperscalerOs` | false |
| `redisStreamsActive` | true |
| `kafkaAdapterDeferred` | true |
| `natsAdapterDeferred` | true |
| `rabbitmqAdapterDeferred` | true |
| `memoryFallbackWhenRedisUnavailable` | true |
| `fabricWidePolicyHardGateRequired` | true |

See ADR-0142.
