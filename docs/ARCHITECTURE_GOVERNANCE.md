# Architecture Governance (VL-346)

Library Phase 213 — part of Volume 20 Enterprise Engineering System (EES).

## Mission

VerbaLab Architecture Governance is a **standards and governance catalog** for engineers and Cursor.
It is not a customer-facing product cloud, not Jira/Confluence/SonarQube OS, and not an
Architecture Knowledge Base / ADR factory OS.

## Honesty

- `engineeringOsForHumansAndCursor=true`
- `customerFacingProductCloud=false`
- `architectureKnowledgeBaseOs=false`
- `adrFactoryOs=false`
- `pointsAtExistingAdrProcess=true`

## Extends / routes to

- `docs/adr` → `docs/adr/` (Existing ADR series)
- `platform-engineering-cloud` → `/v1/platform-engineering-cloud/products` (Platform Engineering)
- `developer-experience-platform` → `/v1/developer-experience-platform/engine` (Developer Experience)

## Surfaces

- Console: `/architecture-governance`
- API: `/v1/architecture-governance/engine`
- ADR: [`docs/adr/0248-architecture-governance.md`](./adr/0248-architecture-governance.md)

---

## Volume status

**Volume 20** Enterprise Engineering System (VL-344–353). Production Audit evidence: [`docs/enterprise-engineering-system-audit/`](./enterprise-engineering-system-audit/).
