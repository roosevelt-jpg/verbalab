# Engineering Quality Platform (VL-348)

Library Phase 215 — part of Volume 20 Enterprise Engineering System (EES).

## Mission

VerbaLab Engineering Quality Platform is a **standards and governance catalog** for engineers and Cursor.
It is not a customer-facing product cloud, not Jira/Confluence/SonarQube OS, and not an
Architecture Knowledge Base / ADR factory OS.

## Honesty

- `engineeringOsForHumansAndCursor=true`
- `customerFacingProductCloud=false`
- `architectureKnowledgeBaseOs=false`
- `adrFactoryOs=false`
- `qualityCatalogNotSonarOs=true`

## Extends / routes to

- `supply-chain-security` → `/v1/supply-chain-security/engine` (Supply Chain Security)
- `reliability-engineering` → `/v1/reliability-engineering/engine` (Reliability Engineering)
- `developer-experience-platform` → `/v1/developer-experience-platform/engine` (DX repo health)

## Surfaces

- Console: `/engineering-quality-platform`
- API: `/v1/engineering-quality-platform/engine`
- ADR: [`docs/adr/0250-engineering-quality-platform.md`](./adr/0250-engineering-quality-platform.md)

---

## Volume status

**Volume 20** Enterprise Engineering System (VL-344–353). Production Audit evidence: [`docs/enterprise-engineering-system-audit/`](./enterprise-engineering-system-audit/).
