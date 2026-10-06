# VerbaLab Enterprise Cloud Foundation

**Status:** Accepted (VL-128)  
**Rule:** Compose existing governance, admin, residency, RBAC, and billing controls. Do not invent a policy engine or Trust Center SaaS.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Workspace Management | `/v1/workspaces` + console switcher (VL-012/125) |
| Enterprise Settings | Org data settings + residency pin (`/data`) |
| Organization Policies | Derived snapshot (`GET /v1/enterprise/policies`) |
| Security Policies | Tenant isolation + RBAC + API key hashing (VL-072/126) |
| Compliance Policies | Data map + retention/persist/training flags (VL-073); **no cert product** |
| Billing Policies | Plan quotas + rate limits (VL-031/071) |
| Cloud Policies | Residency islands + feature flags (VL-075/125) |
| Tenant Isolation | Org-scoped queries + tests (VL-072) |
| Governance | Export / delete / audit (VL-073/032) |
| Administration | Platform admin allowlist (VL-081) |

---

## APIs (VL-128)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/v1/enterprise/overview` | Hub aggregate |
| GET | `/v1/enterprise/policies` | Derived policy snapshot |

Console: `/enterprise` (links to `/data`, `/identity`, `/billing`, `/audit`, `/admin`).

---

## Explicit non-goals

- Policy-as-Code / OPA-style engines  
- SOC2/ISO Trust Center product  
- Automated retention sweeper (still ADR-0022)  
- ABAC, Teams hierarchy, SAML/SCIM IdP rewrite  
- Regenerating admin, regions, or billing  

See ADR-0049.
