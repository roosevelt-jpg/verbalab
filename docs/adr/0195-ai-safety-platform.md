# ADR-0195: AI Safety Platform (VL-293)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-293 (library Phase 160)

## Context

Volume 15 builds Trust Cloud as the enforcement/governance layer over Policy Runtime, AgentOps, Continuous Learning, Volume 12 consent, and existing honesty surfaces. Risks: inventing Okta/GRC/certification/SIEM/Platform Engineering OS, claiming certification, or leaving Safety/Privacy/Governance unwired.

## Decision

1. Ship `ai-safety-platform` as a Nest hub with catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`policyRuntimeIntegrated=true`).
3. Integrate with existing systems — do not regenerate Volumes 1–14.
4. Platform Engineering Cloud remains deferred to Volume 16+.

## Consequences

- AI Safety Platform is discoverable under Trust Cloud Foundation.
- Operators can inspect catalogs without false compliance or IdP/OS claims.
