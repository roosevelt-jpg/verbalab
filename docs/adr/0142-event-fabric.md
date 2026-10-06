# ADR-0142: Event Fabric (Redis Streams + CloudEvents, deferred Kafka/NATS/Rabbit)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-240 (library “Phase 107 Event Fabric” mapped)

## Context

Library Phase 107 asks for an enterprise Event Fabric supporting Kafka, NATS, RabbitMQ, Redis Streams, CloudEvents, versioning, DLQs, retries, replay, snapshots — plus REST/SDK/monitoring/analytics/docs.

ADR-0141 already deferred broker backends to this phase and required a **real** local/dev path (prefer Redis Streams already in the stack) without fake Kafka readiness.

## Decision

1. **Schedule** Event Fabric as executable **VL-240**.  
2. **Active backend:** Redis Streams via `REDIS_URL` (`XADD` / `XREADGROUP` / `XACK`) with in-memory fallback when Redis is unavailable or `EVENT_FABRIC_MEMORY=1`.  
3. **CloudEvents 1.0** envelope on every publish; `eventVersion` / `dataschema` for versioning.  
4. **Ship** DLQ, retries (attempt budget → DLQ), replay (XRANGE / history), consumer-group snapshots, monitoring, analytics.  
5. **Catalog** Kafka / NATS / RabbitMQ as deferred adapters — do not claim cluster readiness.  
6. **Surfaces:** `/event-fabric` console, REST under `/v1/event-fabric/*`, GraphQL `eventFabricCapabilities` / `eventFabricBrokers`, SDK/CLI, docs + OpenAPI.  
7. **Honesty:** `kafkaHyperscalerOs: false`, `redisClusterOs: false`, `customerFacingProduct: false`.  
8. **Safety:** keep `fabricWidePolicyHardGateRequired` / `policyLogOnlyForbidden` for Policy Fabric.  
9. Update AI Fabric catalog: Event Fabric bus → **shipped**; clear Foundation `brokerBackendsDeferred`.  
10. Do **not** regenerate Volumes 1–9 or AI Fabric Foundation.

## Consequences

- Publish/poll works in CI via memory backend without Redis.  
- Ops with Redis get a real Streams path to verify.  
- Kafka/NATS/Rabbit remain explicit future work, not greenwashed.  
- Context Fabric (VL-241) can consume this bus next.
