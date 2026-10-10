# ADR-0248: Architecture Governance (VL-346)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-346 (library Phase 213)

## Context

Volume 20 builds the Enterprise Engineering System as standards, governance, templates,
and quality catalogs. Risk: inventing Jira/Confluence/SonarQube OS, mass-generating 250 ADRs /
200 PRDs, inventing Architecture Knowledge Base OS, or regenerating Platform Engineering /
Developer Experience / Trust AI Governance / existing `docs/adr/`.

## Decision

1. Ship `architecture-governance` as a Nest hub with catalog + service + controller + CQRS + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`architectureKnowledgeBaseOs=false`; `adrFactoryOs=false`; `customerFacingProductCloud=false`).
3. Extend Platform Engineering, DX, Trust AI Governance, and existing ADR process — do not regenerate them.
4. Reject ADR factory / Architecture Knowledge Base OS / mass PRD invention in this volume.

## Consequences

- Architecture Governance is discoverable under Enterprise Engineering System Foundation.
- Operators and Cursor agents can inspect standards catalogs with explicit honesty gates.
