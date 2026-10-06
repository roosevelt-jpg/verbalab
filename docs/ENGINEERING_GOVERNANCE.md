# Engineering Governance (VL-345)

Library Phase 212 — part of Volume 20 Enterprise Engineering System (EES).

## Mission

VerbaLab Engineering Governance is a **standards and governance catalog** for engineers and Cursor.
It is not a customer-facing product cloud, not Jira/Confluence/SonarQube OS, and not an
Architecture Knowledge Base / ADR factory OS.

## Honesty

- `engineeringOsForHumansAndCursor=true`
- `customerFacingProductCloud=false`
- `architectureKnowledgeBaseOs=false`
- `adrFactoryOs=false`
- `extendsAiGovernance=true`

## Extends / routes to

- `ai-governance-platform` → `/v1/ai-governance-platform/engine` (AI Governance (Vol 15))
- `trust-cloud` → `/v1/trust-cloud/products` (Trust Cloud)
- `release-engineering` → `/v1/release-engineering/engine` (Release Engineering)
- `platform-engineering-cloud` → `/v1/platform-engineering-cloud/products` (Platform Engineering Cloud)

## Surfaces

- Console: `/engineering-governance`
- API: `/v1/engineering-governance/engine`
- ADR: [`docs/adr/0247-engineering-governance.md`](./adr/0247-engineering-governance.md)

---

## Volume status

**Volume 20** Enterprise Engineering System (VL-344–353). Production Audit evidence: [`docs/enterprise-engineering-system-audit/`](./enterprise-engineering-system-audit/).
