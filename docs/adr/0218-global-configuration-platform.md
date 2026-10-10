# ADR-0218: Global Configuration Platform (VL-316)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-316 (library Phase 183)

## Context

Volume 17 builds Control Plane Cloud as the highest-privilege management layer over Policy Runtime,
Policy Fabric, Trust Cloud, Identity, and Platform Engineering. Risks: inventing a second policy OS
or IdP, claiming Kubernetes/Istio/Vault/Data Plane OS, executing inference here, or regenerating Volumes 1–16.

## Decision

1. Ship `global-configuration-platform` as a Nest hub with catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`secretsRefsOnly=true`; `executesInference=false`).
3. Wire over Policy Runtime / Trust / Identity / Platform Engineering — do not invent a second policy OS or IdP.
4. Data Plane remains deferred to Volume 18+.

## Consequences

- Global Configuration Platform is discoverable under Control Plane Cloud Foundation.
- Operators can inspect catalogs with explicit least-privilege / secrets / deploy-auth honesty where applicable.
