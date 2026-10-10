# ADR-0112: Enterprise Knowledge APIs (pack over existing surfaces, not gRPC/Kafka OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-201 (library “Phase 68 Enterprise Knowledge APIs” mapped)

## Context

Library Phase 68 asks for Knowledge APIs covering REST, GraphQL, gRPC, realtime, SDK, CLI, webhooks, event streaming, developer portal, OpenAPI, SDK generator, docs, and production deployment.

Knowledge Cloud products already expose REST + GraphQL + OpenAPI + SDK/CLI. Developer Cloud (VL-127) owns the portal. Inventing a second API platform (gRPC mesh, Kafka bus, codegen factory) would violate extend-don’t-regenerate.

## Decision

1. **Ship** `/v1/knowledge-apis/*` as the Knowledge Cloud public API pack hub.
2. **Catalog** existing REST/GraphQL/console surfaces; point at shared OpenAPI and VL-127 developers.
3. **Realtime** = SSE audit-event tail (one-shot), not bidirectional sessions.
4. **Webhooks** = event catalog + existing signed `WebhookService` / signing-secret endpoint.
5. **Defer** gRPC, Kafka/Pulsar event streaming OS, multi-language SDK generator.
6. **Flip** Knowledge Cloud catalog `enterprise-knowledge-apis` notes/API to this pack; deferred flag → false.

## Consequences

- Developers discover Knowledge Cloud APIs from one pack without regenerating VL-062 or Developer Cloud.
- Full Knowledge Analytics remains Phase 69 / VL-202.
