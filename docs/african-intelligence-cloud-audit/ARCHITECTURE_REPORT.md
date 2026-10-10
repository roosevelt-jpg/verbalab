# African Intelligence Cloud — Architecture Report (VL-270)

## Style

- Nest modular monolith with bounded hubs under `apps/api/src/*`
- CQRS catalog slices for GraphQL reads (`hexagonalRewrite: false`)
- REST engine/products/monitoring on every hub; foundation adds routing/overview
- Extends Language Cloud, Knowledge Cloud, Intelligence Cloud, dialects/locales

## Surfaces

| Layer | Implementation |
| --- | --- |
| REST | `/v1/<hub>/engine|products|monitoring` (+ domain list/query) |
| GraphQL | Hub product/engine queries via QueryBus |
| SDK/CLI | Thin helpers for catalogs |
| Console | `/<hub>` pages in `apps/web` |
| OpenAPI | Paths in `openapi.document.ts` |
| Infra | Shared Docker/Fly/Terraform/EKS — no new graph DB |

## Honesty architecture

- Foundation architecture notes encode `neo4jOs`, `digitalTwinOs`, `globalIntelligenceOs`, `traditionalKnowledgeConsentRequired`
- Cultural entries require consent metadata
- Domain engines embed safety objects in engine responses (behavioral, not ToS-only)
