# Enterprise Engineering System — Architecture Validation

## Role

EES is the engineering operating system for humans and Cursor — standards, governance,
templates, and quality catalogs. It extends:

| Upstream | Volume | Role |
| --- | --- | --- |
| Platform Engineering Cloud | 16 | Internal developer platform |
| Developer Experience Platform | 16 | CLI/SDK/docs |
| AI Governance / Trust Cloud | 15 | Human sign-off / trust |
| Existing `docs/adr/` | — | ADR process (not regenerated) |
| FinOps / Secrets | 16/17 | GPU budgets + envelope honesty |

## Pattern

Each EES hub is a Nest catalog façade:

1. Catalog of standards/governance capabilities + `routesTo` existing surfaces.
2. Service injects related Nest modules where useful and exposes route/list/query.
3. CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
4. Honesty: `architectureKnowledgeBaseOs=false`, `adrFactoryOs=false`.

## Hub map

| Hub | Focus |
| --- | --- |
| engineering-governance | Councils + CAB/TSC + approval statuses |
| architecture-governance | ADR/RFC/design/radar/deps/compliance |
| repository-standards | Monorepo reality standards |
| engineering-quality-platform | Quality dimensions
| ai-engineering-standards | AI standards + retroactiveChecks |
| api-engineering-standards | REST/GraphQL/gRPC/SDK standards |
| database-engineering-standards | Postgres/Redis/ES/vector/KG standards |
| infrastructure-engineering-standards | IaC/deploy/GPU + FinOps/secrets honesty |
