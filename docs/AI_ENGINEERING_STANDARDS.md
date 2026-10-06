# AI Engineering Standards (VL-349)

Library Phase 216 — part of Volume 20 Enterprise Engineering System (EES).

## Mission

VerbaLab AI Engineering Standards is a **standards and governance catalog** for engineers and Cursor.
It is not a customer-facing product cloud, not Jira/Confluence/SonarQube OS, and not an
Architecture Knowledge Base / ADR factory OS.

## Honesty

- `engineeringOsForHumansAndCursor=true`
- `customerFacingProductCloud=false`
- `architectureKnowledgeBaseOs=false`
- `adrFactoryOs=false`
- `retroactiveChecksEnabled=true`

## Extends / routes to

- `ai-governance-platform` → `/v1/ai-governance-platform/engine` (AI Governance)
- `ai-safety-platform` → `/v1/ai-safety-platform/engine` (AI Safety)
- `evaluation-platform` → `/v1/evaluation-platform/engine` (Evaluation Platform)
- `promptops-platform` → `/v1/promptops-platform/engine` (PromptOps)
- `secrets-certificate-platform` → `/v1/secrets-certificate-platform/engine` (Secrets (Vol 17))

## Surfaces

- Console: `/ai-engineering-standards`
- API: `/v1/ai-engineering-standards/engine`
- ADR: [`docs/adr/0251-ai-engineering-standards.md`](./adr/0251-ai-engineering-standards.md)

---

## Volume status

**Volume 20** Enterprise Engineering System (VL-344–353). Production Audit evidence: [`docs/enterprise-engineering-system-audit/`](./enterprise-engineering-system-audit/).
