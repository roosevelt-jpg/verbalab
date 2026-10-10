# ADR-0196: AI Governance Platform (VL-294)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-294 (library Phase 161)

## Context

Volume 15 builds Trust Cloud as the enforcement/governance layer over Policy Runtime, AgentOps, Continuous Learning, Volume 12 consent, and existing honesty surfaces. Risks: inventing Okta/GRC/certification/SIEM/Platform Engineering OS, claiming certification, or leaving Safety/Privacy/Governance unwired.

## Decision

1. Ship `ai-governance-platform` as a Nest hub with catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`humanSignOffRequired=true`).
3. Integrate with existing systems — do not regenerate Volumes 1–14.
4. Platform Engineering Cloud remains deferred to Volume 16+.

## Consequences

- AI Governance Platform is discoverable under Trust Cloud Foundation.
- Operators can inspect catalogs without false compliance or IdP/OS claims.
