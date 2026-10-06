# Enterprise Engineering System (VL-344)

Library Phase 211 — part of Volume 20 Enterprise Engineering System (EES).

## Mission

EES is the **engineering operating system for humans and Cursor** — standards, governance,
templates, and quality catalogs. It is **not** a customer-facing product cloud, **not**
Jira/Confluence/SonarQube OS, and **not** an Architecture Knowledge Base / ADR factory OS.

## Honesty

- `engineeringOsForHumansAndCursor=true`
- `customerFacingProductCloud=false`
- `architectureKnowledgeBaseOs=false` (deferred past Volume 20)
- `adrFactoryOs=false` (deferred past Volume 20)

## Products

| Hub | VL | Role |
| --- | --- | --- |
| enterprise-engineering-system | 344 | Foundation catalog |
| engineering-governance | 345 | Councils + CAB/TSC |
| architecture-governance | 346 | ADR/RFC workflows → existing docs/adr |
| repository-standards | 347 | Monorepo reality standards |
| engineering-quality-platform | 348 | Quality catalog (`sonarqubeOs=false`) |
| ai-engineering-standards | 349 | AI standards + retroactiveChecks |
| api-engineering-standards | 350 | API/SDK standards |
| database-engineering-standards | 351 | DB standards (`databaseOs=false`) |
| infrastructure-engineering-standards | 352 | Infra standards (`kubernetesOs=false`) |

## Surfaces

- Console: `/enterprise-engineering-system`
- API: `/v1/enterprise-engineering-system/products` (also `/engine`, `/routing`, `/monitoring`, `/overview`)
- ADR: [`docs/adr/0246-enterprise-engineering-system.md`](./adr/0246-enterprise-engineering-system.md)

---

## Volume status

**Volume 20 closed** (VL-344–353). Production Audit evidence: [`docs/enterprise-engineering-system-audit/`](./enterprise-engineering-system-audit/).
Architecture Knowledge Base / mass ADR factory deferred past Volume 20.
