# API Engineering Standards (VL-350)

Library Phase 217 — part of Volume 20 Enterprise Engineering System (EES).

## Mission

VerbaLab API Engineering Standards is a **standards and governance catalog** for engineers and Cursor.
It is not a customer-facing product cloud, not Jira/Confluence/SonarQube OS, and not an
Architecture Knowledge Base / ADR factory OS.

## Honesty

- `engineeringOsForHumansAndCursor=true`
- `customerFacingProductCloud=false`
- `architectureKnowledgeBaseOs=false`
- `adrFactoryOs=false`
- `reflectsExistingOpenApiSdk=true`

## Extends / routes to

- `openapi` → `/v1/openapi.json` (OpenAPI document)
- `developer-cloud` → `/v1/developer-cloud/products` (Developer Cloud)
- `developer-experience-platform` → `/v1/developer-experience-platform/engine` (DX SDK/CLI)

## Surfaces

- Console: `/api-engineering-standards`
- API: `/v1/api-engineering-standards/engine`
- ADR: [`docs/adr/0252-api-engineering-standards.md`](./adr/0252-api-engineering-standards.md)

---

## Volume status

**Volume 20** Enterprise Engineering System (VL-344–353). Production Audit evidence: [`docs/enterprise-engineering-system-audit/`](./enterprise-engineering-system-audit/).
