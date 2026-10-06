# Database Engineering Standards (VL-351)

Library Phase 218 — part of Volume 20 Enterprise Engineering System (EES).

## Mission

VerbaLab Database Engineering Standards is a **standards and governance catalog** for engineers and Cursor.
It is not a customer-facing product cloud, not Jira/Confluence/SonarQube OS, and not an
Architecture Knowledge Base / ADR factory OS.

## Honesty

- `engineeringOsForHumansAndCursor=true`
- `customerFacingProductCloud=false`
- `architectureKnowledgeBaseOs=false`
- `adrFactoryOs=false`
- `extendsExistingPrismaDb=true`

## Extends / routes to

- `knowledge-cloud` → `/v1/knowledge-cloud/products` (Knowledge Cloud)
- `vector-cloud` → `/v1/vector-cloud/engine` (Vector Cloud)
- `embedding-runtime` → `/v1/embedding-runtime/engine` (Embedding Runtime)

## Surfaces

- Console: `/database-engineering-standards`
- API: `/v1/database-engineering-standards/engine`
- ADR: [`docs/adr/0253-database-engineering-standards.md`](./adr/0253-database-engineering-standards.md)

---

## Volume status

**Volume 20** Enterprise Engineering System (VL-344–353). Production Audit evidence: [`docs/enterprise-engineering-system-audit/`](./enterprise-engineering-system-audit/).
