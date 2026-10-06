# Infrastructure Engineering Standards (VL-352)

Library Phase 219 — part of Volume 20 Enterprise Engineering System (EES).

## Mission

Lugemi Infrastructure Engineering Standards is a **standards and governance catalog** for engineers and Cursor.
It is not a customer-facing product cloud, not Jira/Confluence/SonarQube OS, and not an
Architecture Knowledge Base / ADR factory OS.

## Honesty

- `engineeringOsForHumansAndCursor=true`
- `customerFacingProductCloud=false`
- `architectureKnowledgeBaseOs=false`
- `adrFactoryOs=false`
- `referencesFinopsAndSecretsHonesty=true`

## Extends / routes to

- `finops-platform` → `/v1/finops-platform/engine` (FinOps GPU budgets)
- `secrets-certificate-platform` → `/v1/secrets-certificate-platform/engine` (Control Plane secrets honesty)
- `gpu-platform` → `/v1/gpu-platform/engine` (GPU Platform)
- `gitops-platform` → `/v1/gitops-platform/engine` (GitOps / deploy)
- `global-deployment-controller` → `/v1/global-deployment-controller/engine` (Deploy controller)

## Surfaces

- Console: `/infrastructure-engineering-standards`
- API: `/v1/infrastructure-engineering-standards/engine`
- ADR: [`docs/adr/0254-infrastructure-engineering-standards.md`](./adr/0254-infrastructure-engineering-standards.md)

---

## Volume status

**Volume 20** Enterprise Engineering System (VL-344–353). Production Audit evidence: [`docs/enterprise-engineering-system-audit/`](./enterprise-engineering-system-audit/).
