# ADR-0201: Identity Federation (VL-299)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-299 (library Phase 166)

## Context

Volume 15 builds Trust Cloud as the enforcement/governance layer over Policy Runtime, AgentOps, Continuous Learning, Volume 12 consent, and existing honesty surfaces. Risks: inventing Okta/GRC/certification/SIEM/Platform Engineering OS, claiming certification, or leaving Safety/Privacy/Governance unwired.

## Decision

1. Ship `identity-federation` as a Nest hub with catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`oktaOs=false`).
3. Integrate with existing systems — do not regenerate Volumes 1–14.
4. Platform Engineering Cloud remains deferred to Volume 16+.

## Consequences

- Identity Federation is discoverable under Trust Cloud Foundation.
- Operators can inspect catalogs without false compliance or IdP/OS claims.
