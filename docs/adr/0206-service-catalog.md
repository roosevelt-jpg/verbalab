# ADR-0206: Service Catalog (VL-304)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-304 (library Phase 171)

## Context

Volume 16 builds Platform Engineering Cloud as internal IDP tooling for VerbaLab engineers. Risks: inventing Backstage/Argo/Flux/K8s/Snyk/Datadog/AI Cloud OS, regenerating Volumes 1–15, or claiming Control Plane / Data Plane here.

## Decision

1. Ship `service-catalog` as a Nest hub with catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`serviceMeshOs=false`).
3. Integrate with Volume 7 GPU/Inference cost surfaces and Volume 10 Fabric where relevant.
4. Control Plane / Data Plane / AI Cloud OS remain deferred to Volume 17+.

## Consequences

- Service Catalog is discoverable under Platform Engineering Cloud Foundation.
- Operators can inspect catalogs without false OS claims.
