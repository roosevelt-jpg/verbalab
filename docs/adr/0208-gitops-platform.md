# ADR-0208: GitOps Platform (VL-306)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-306 (library Phase 173)

## Context

Volume 16 builds Platform Engineering Cloud as internal IDP tooling for Lugemi engineers. Risks: inventing Backstage/Argo/Flux/K8s/Snyk/Datadog/AI Cloud OS, regenerating Volumes 1–15, or claiming Control Plane / Data Plane here.

## Decision

1. Ship `gitops-platform` as a Nest hub with catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`argoCdOs=false`).
3. Integrate with Volume 7 GPU/Inference cost surfaces and Volume 10 Fabric where relevant.
4. Control Plane / Data Plane / AI Cloud OS remain deferred to Volume 17+.

## Consequences

- GitOps Platform is discoverable under Platform Engineering Cloud Foundation.
- Operators can inspect catalogs without false OS claims.
