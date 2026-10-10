# ADR-0222: Secrets & Certificate Platform (VL-320)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-320 (library Phase 187)

## Context

Volume 17 builds Control Plane Cloud as the highest-privilege management layer over Policy Runtime,
Policy Fabric, Trust Cloud, Identity, and Platform Engineering. Risks: inventing a second policy OS
or IdP, claiming Kubernetes/Istio/Vault/Data Plane OS, executing inference here, or regenerating Volumes 1–16.

## Decision

1. Ship `secrets-certificate-platform` as a Nest hub with catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`encryptedAtRest=true`; `executesInference=false`).
3. Wire over Policy Runtime / Trust / Identity / Platform Engineering — do not invent a second policy OS or IdP.
4. Data Plane remains deferred to Volume 18+.

## Consequences

- Secrets & Certificate Platform is discoverable under Control Plane Cloud Foundation.
- Operators can inspect catalogs with explicit least-privilege / secrets / deploy-auth honesty where applicable.
